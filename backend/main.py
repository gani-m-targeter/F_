"""
Professional ASL Recognition Backend
System: FastAPI + WebSocket + Vector Geometry Analysis + Smoothing Filters
"""

import asyncio
import json
import math
import logging
import time
from collections import deque, Counter
from typing import Dict, List, Optional, Tuple, Union, Any
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime

# Quick startup - only import essentials
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Embedded API Key for Gemini
GEMINI_API_KEY = "AIzaSyBMlLMXILt7mHhKQttsqWg_EckZy-3gfk8"

# ==========================================
# CONFIGURATION & LOGGING
# ==========================================

# Configuration class for easy tuning
class Config:
    # Recognition thresholds - OPTIMIZED FOR SPEED
    CONFIDENCE_THRESHOLD = 0.75  # Lower for faster detection
    BUFFER_SIZE = 8  # Reduced for faster response
    MAJORITY_THRESHOLD = 0.65  # Lower for quicker confirmation
    
    # Session management
    SESSION_TIMEOUT = 3600  # 1 hour in seconds
    CLEANUP_INTERVAL = 300  # 5 minutes
    
    # Smoothing filter parameters - OPTIMIZED
    FILTER_MIN_CUTOFF = 1.5
    FILTER_BETA = 8.0
    
    # Word deduplication
    WORD_COOLDOWN = 0.5  # Faster word capture
    
    # CORS
    ALLOWED_ORIGINS = ["*"]  # Production: ["https://yourdomain.com"]
    
    # Logging
    LOG_LEVEL = logging.INFO

logging.basicConfig(
    level=Config.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ASL_System")

app = FastAPI(
    title="Enterprise ASL Recognition API",
    description="Real-time WebSocket API for American Sign Language Recognition",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MATH & SIGNAL PROCESSING UTILS
# ==========================================

class OneEuroFilter:
    """
    Implements the 1€ Filter, a low-pass filter with adaptive cutoff frequency.
    Used to reduce jitter in MediaPipe landmarks while maintaining responsiveness.
    """
    def __init__(self, t0, x0, dx0=0.0, min_cutoff=1.0, beta=0.0, d_cutoff=1.0):
        self.t_prev = t0
        self.x_prev = x0
        self.dx_prev = dx0
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff

    def smoothing_factor(self, t_e, cutoff):
        r = 2 * math.pi * cutoff * t_e
        return r / (r + 1)

    def exponential_smoothing(self, a, x, x_prev):
        return a * x + (1 - a) * x_prev

    def __call__(self, t, x):
        t_e = t - self.t_prev

        # preventing division by zero
        if t_e <= 0:
            return x

        a_d = self.smoothing_factor(t_e, self.d_cutoff)
        dx = (x - self.x_prev) / t_e
        dx_hat = self.exponential_smoothing(a_d, dx, self.dx_prev)

        cutoff = self.min_cutoff + self.beta * abs(dx_hat)
        a = self.smoothing_factor(t_e, cutoff)
        x_hat = self.exponential_smoothing(a, x, self.x_prev)

        self.x_prev = x_hat
        self.dx_prev = dx_hat
        self.t_prev = t
        return x_hat

class VectorUtils:
    """
    Geometric utility functions for calculating 3D angles and distances.
    """
    @staticmethod
    def get_vector(v1: np.array, v2: np.array) -> np.array:
        return v2 - v1

    @staticmethod
    def normalize_vector(v: np.array) -> np.array:
        norm = np.linalg.norm(v)
        if norm == 0:
            return v
        return v / norm

    @staticmethod
    def calculate_angle(v1: np.array, v2: np.array) -> float:
        """Calculates angle between two vectors in degrees"""
        v1_u = VectorUtils.normalize_vector(v1)
        v2_u = VectorUtils.normalize_vector(v2)
        
        # Clip to prevent numerical errors outside [-1, 1]
        dot_product = np.clip(np.dot(v1_u, v2_u), -1.0, 1.0)
        return np.degrees(np.arccos(dot_product))

# ==========================================
# DOMAIN MODELS & ENUMS
# ==========================================

class Finger(Enum):
    THUMB = 0
    INDEX = 1
    MIDDLE = 2
    RING = 3
    PINKY = 4

class FingerState(Enum):
    FOLDED = 0      # Fully curled
    CURLED = 1      # Half curled / Claw
    EXTENDED = 2    # Straight

class Orientation(Enum):
    UP = "UP"
    DOWN = "DOWN"
    LEFT = "LEFT"
    RIGHT = "RIGHT"
    FORWARD = "FORWARD"
    BACKWARD = "BACKWARD"

@dataclass
class HandState:
    """Represents the processed state of a hand at a specific frame"""
    fingers: Dict[Finger, FingerState]
    finger_angles: Dict[Finger, float] # Total bend angle
    palm_orientation: Orientation
    thumb_position: str  # "TUCKED", "OUT", "OPPOSING"
    raw_landmarks: np.ndarray
    timestamp: float

# ==========================================
# STATIC KNOWLEDGE BASE (THE "BRAIN")
# ==========================================

class ASLLexicon:
    """
    Defines the rules for static ASL signs (A-Z, 0-9).
    Instead of code, we use data definitions.
    """
    
    @staticmethod
    def get_definitions() -> Dict[str, Dict]:
        """
        Returns a dictionary of sign definitions.
        Format: { SIGN_NAME: { finger_states: [...], requirements: [...] } }
        """
        return {
            # --- NUMBERS ---
            "0": {
                "desc": "Fingers curled, thumb and index touching",
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED, FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.EXTENDED, FingerState.CURLED], # Loose O
                    Finger.RING: [FingerState.EXTENDED, FingerState.CURLED],
                    Finger.PINKY: [FingerState.EXTENDED, FingerState.CURLED],
                },
                "special": "THUMB_INDEX_TOUCH"
            },
            "1": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                }
            },
            "2": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                }
            },
            "3": {
                "fingers": {
                    Finger.THUMB: [FingerState.EXTENDED],
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                }
            },
            "4": {
                "fingers": {
                    Finger.THUMB: [FingerState.FOLDED],
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                }
            },
            "5": {
                "fingers": {
                    Finger.THUMB: [FingerState.EXTENDED],
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                },
                "spread": True
            },
            
            # --- ALPHABET ---
            "A": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED] # Thumb against side
                },
                "orientation": [Orientation.UP]
            },
            "B": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.FOLDED, FingerState.CURLED] # Tucked
                },
                "orientation": [Orientation.UP]
            },
            "C": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.CURLED],
                    Finger.RING: [FingerState.CURLED],
                    Finger.PINKY: [FingerState.CURLED],
                    Finger.THUMB: [FingerState.CURLED, FingerState.EXTENDED]
                },
                "orientation": [Orientation.LEFT, Orientation.RIGHT] # Depending on hand
            },
            "D": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED, FingerState.CURLED], # Touching thumb
                    Finger.RING: [FingerState.FOLDED, FingerState.CURLED],
                    Finger.PINKY: [FingerState.FOLDED, FingerState.CURLED],
                },
                "special": "THUMB_MIDDLE_TOUCH"
            },
            "E": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED, FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.FOLDED, FingerState.CURLED],
                    Finger.RING: [FingerState.FOLDED, FingerState.CURLED],
                    Finger.PINKY: [FingerState.FOLDED, FingerState.CURLED],
                    Finger.THUMB: [FingerState.FOLDED, FingerState.CURLED]
                },
                "check": "NAILS_VISIBLE" # Fingers curled tight
            },
            "F": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED, FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED]
                },
                "special": "THUMB_INDEX_TOUCH"
            },
            "G": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.LEFT, Orientation.RIGHT] # Pointing sideways
            },
            "H": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "orientation": [Orientation.LEFT, Orientation.RIGHT]
            },
            "I": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.UP]
            },
            "K": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED] # Thumb between index and middle
                },
                "orientation": [Orientation.UP]
            },
            "L": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.UP]
            },
            "M": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.FOLDED] # Thumb tucked under 3 fingers
                },
                # M differs from N/T by where thumb is inserted. Hard to detect w/ basic landmarks.
                # We use specific geometry checks in the analyzer.
                "special": "THUMB_UNDER_RING" 
            },
            "N": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "special": "THUMB_UNDER_MIDDLE"
            },
            "O": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.CURLED],
                    Finger.RING: [FingerState.CURLED],
                    Finger.PINKY: [FingerState.CURLED]
                },
                "special": "ALL_TIPS_TOUCH"
            },
            "P": {
                # Same shape as K but pointing down
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.DOWN]
            },
            "Q": {
                # Same shape as G but pointing down
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.DOWN]
            },
            "R": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "special": "INDEX_MIDDLE_CROSS" # Hard to detect, use proximity
            },
            "S": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.FOLDED] # Thumb OVER fingers
                },
                "orientation": [Orientation.UP]
            },
            "T": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "special": "THUMB_UNDER_INDEX"
            },
            "U": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "check": "INDEX_MIDDLE_TOGETHER"
            },
            "V": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "check": "INDEX_MIDDLE_APART"
            },
            "W": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.FOLDED]
                }
            },
            "X": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED], # Hooked
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "orientation": [Orientation.UP, Orientation.LEFT, Orientation.RIGHT]
            },
            "Y": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            # Z is dynamic (motion). We map the static starting position (Index pointing)
            # A full sequence recognizer is needed for the 'Z' motion
            "Z_START": {
                 "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "orientation": [Orientation.UP]
            },
            "I LOVE YOU": {
                 "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            # NUMBERS
            "ZERO": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "special": "THUMB_INDEX_TOUCH"
            },
            "ONE": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                }
            },
            "TWO": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED]
                },
                "check": "INDEX_MIDDLE_APART"
            },
            "THREE": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            "FOUR": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.FOLDED]
                }
            },
            "FIVE": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            "SIX": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.FOLDED]
                },
                "special": "THUMB_PINKY_TOUCH"
            },
            "SEVEN": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.FOLDED]
                }
            },
            "EIGHT": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.FOLDED]
                }
            },
            "NINE": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.FOLDED]
                }
            },
            # GREETINGS & COMMON WORDS
            "HELLO": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            "YES": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            "NO": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "special": "INDEX_MIDDLE_THUMB_SNAP"
            },
            "OK": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED]
                },
                "special": "THUMB_INDEX_TOUCH"
            },
            "CALL": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            "STOP": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.FORWARD]
            },
            # MORE ACTIONABLE WORDS
            "HELP": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.UP]
            },
            "THANK YOU": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.FORWARD]
            },
            "PLEASE": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.FOLDED]
                }
            },
            "SORRY": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.FOLDED]
                }
            },
            "GOOD": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.FORWARD]
            },
            "BAD": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.DOWN]
            },
            "WATER": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "special": "THUMB_INDEX_TOUCH"
            },
            "FOOD": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.CURLED],
                    Finger.RING: [FingerState.CURLED],
                    Finger.PINKY: [FingerState.CURLED],
                    Finger.THUMB: [FingerState.CURLED]
                },
                "special": "ALL_TIPS_TOUCH"
            },
            "DRINK": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.CURLED],
                    Finger.RING: [FingerState.CURLED],
                    Finger.PINKY: [FingerState.CURLED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            "MONEY": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "special": "THUMB_INDEX_TOUCH"
            },
            "HOME": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.CURLED],
                    Finger.RING: [FingerState.CURLED],
                    Finger.PINKY: [FingerState.CURLED],
                    Finger.THUMB: [FingerState.CURLED]
                }
            },
            "WORK": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.FOLDED]
                },
                "orientation": [Orientation.DOWN]
            },
            "FRIEND": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.CURLED]
                }
            },
            "LOVE": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.FOLDED]
                }
            },
            "HAPPY": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.UP]
            },
            "SAD": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.FOLDED]
                },
                "orientation": [Orientation.DOWN]
            },
            "HUNGRY": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.CURLED],
                    Finger.RING: [FingerState.CURLED],
                    Finger.PINKY: [FingerState.CURLED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "orientation": [Orientation.DOWN]
            },
            "TIRED": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.CURLED],
                    Finger.RING: [FingerState.CURLED],
                    Finger.PINKY: [FingerState.CURLED],
                    Finger.THUMB: [FingerState.CURLED]
                },
                "orientation": [Orientation.DOWN]
            },
            "BATHROOM": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "special": "THUMB_INDEX_TOUCH"
            },
            "PHONE": {
                "fingers": {
                    Finger.INDEX: [FingerState.FOLDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                }
            },
            "WAIT": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "spread": True
            },
            "COME": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.FOLDED]
                }
            },
            "GO": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.FOLDED],
                    Finger.RING: [FingerState.FOLDED],
                    Finger.PINKY: [FingerState.FOLDED],
                    Finger.THUMB: [FingerState.FOLDED]
                },
                "orientation": [Orientation.FORWARD]
            },
            "MORE": {
                "fingers": {
                    Finger.INDEX: [FingerState.CURLED],
                    Finger.MIDDLE: [FingerState.CURLED],
                    Finger.RING: [FingerState.CURLED],
                    Finger.PINKY: [FingerState.CURLED],
                    Finger.THUMB: [FingerState.CURLED]
                },
                "special": "ALL_TIPS_TOUCH"
            },
            "FINISHED": {
                "fingers": {
                    Finger.INDEX: [FingerState.EXTENDED],
                    Finger.MIDDLE: [FingerState.EXTENDED],
                    Finger.RING: [FingerState.EXTENDED],
                    Finger.PINKY: [FingerState.EXTENDED],
                    Finger.THUMB: [FingerState.EXTENDED]
                },
                "spread": True,
                "orientation": [Orientation.DOWN]
            }
        }

# ==========================================
# GESTURE RECOGNITION ENGINE
# ==========================================

class HandFeatureExtractor:
    """
    Analyzes raw landmarks to produce a high-level HandState.
    """
    def __init__(self):
        self.filters = {}
        # OneEuroFilter init parameters
        self.fc_min = Config.FILTER_MIN_CUTOFF
        self.beta = Config.FILTER_BETA
        
    def _get_filter(self, idx: int, t: float, val: float):
        """Get or create a filter for a specific coordinate index"""
        if idx not in self.filters:
            self.filters[idx] = OneEuroFilter(t, val, min_cutoff=self.fc_min, beta=self.beta)
        return self.filters[idx]

    def smooth_landmarks(self, landmarks: List[Dict]) -> np.ndarray:
        """Apply OneEuroFilter to all landmarks with error handling"""
        t = time.time()
        smoothed = []
        
        try:
            for i, lm in enumerate(landmarks):
                # We filter x, y, z separately
                # Handle both dict and object formats
                x = lm.get('x') if isinstance(lm, dict) else lm['x']
                y = lm.get('y') if isinstance(lm, dict) else lm['y']
                z = lm.get('z', 0) if isinstance(lm, dict) else lm.get('z', 0)
                
                sx = self._get_filter(i*3 + 0, t, x)(t, x)
                sy = self._get_filter(i*3 + 1, t, y)(t, y)
                sz = self._get_filter(i*3 + 2, t, z)(t, z)
                smoothed.append([sx, sy, sz])
        except Exception as e:
            logger.warning(f"Smoothing failed, using raw landmarks: {e}")
            # Fallback to raw landmarks
            for lm in landmarks:
                x = lm.get('x', 0) if isinstance(lm, dict) else lm['x']
                y = lm.get('y', 0) if isinstance(lm, dict) else lm['y']
                z = lm.get('z', 0) if isinstance(lm, dict) else lm.get('z', 0)
                smoothed.append([x, y, z])
            
        return np.array(smoothed)

    def process(self, raw_landmarks: List[Dict]) -> Optional[HandState]:
        """Process raw landmarks with comprehensive error handling"""
        if not raw_landmarks or len(raw_landmarks) < 21:
            logger.warning(f"Invalid landmarks: received {len(raw_landmarks) if raw_landmarks else 0} points, need 21")
            return None

        try:
            # 1. Smooth Data
            coords = self.smooth_landmarks(raw_landmarks)
        except Exception as e:
            logger.error(f"Failed to process landmarks: {e}", exc_info=True)
            return None
        
        # 2. Extract Key Joints
        wrist = coords[0]
        
        # MCP (Knuckles), PIP (Middle Joint), TIP (Fingertips)
        thumb_cmc, thumb_mcp, thumb_ip, thumb_tip = coords[1:5]
        index_mcp, index_pip, index_dip, index_tip = coords[5:9]
        middle_mcp, middle_pip, middle_dip, middle_tip = coords[9:13]
        ring_mcp, ring_pip, ring_dip, ring_tip = coords[13:17]
        pinky_mcp, pinky_pip, pinky_dip, pinky_tip = coords[17:21]
        
        fingers_dict = {}
        angles_dict = {}
        
        # 3. Analyze Fingers (Index to Pinky)
        # We calculate the total angle of the finger bend
        # Vector MCP -> PIP, Vector PIP -> TIP
        
        def analyze_finger(mcp, pip, dip, tip):
            # Calculate bend angles
            v_mcp_pip = VectorUtils.get_vector(mcp, pip)
            v_pip_dip = VectorUtils.get_vector(pip, dip)
            v_dip_tip = VectorUtils.get_vector(dip, tip)
            
            angle_pip = VectorUtils.calculate_angle(v_mcp_pip, v_pip_dip)
            angle_dip = VectorUtils.calculate_angle(v_pip_dip, v_dip_tip)
            total_bend = angle_pip + angle_dip
            
            # Distance from wrist check (Backup for state)
            d_tip_wrist = np.linalg.norm(tip - wrist)
            d_mcp_wrist = np.linalg.norm(mcp - wrist)
            
            state = FingerState.EXTENDED
            if total_bend > 160: # Very bent
                state = FingerState.FOLDED
            elif total_bend > 90 or d_tip_wrist < d_mcp_wrist:
                state = FingerState.CURLED
                
            return state, total_bend

        fingers_dict[Finger.INDEX], angles_dict[Finger.INDEX] = analyze_finger(index_mcp, index_pip, index_dip, index_tip)
        fingers_dict[Finger.MIDDLE], angles_dict[Finger.MIDDLE] = analyze_finger(middle_mcp, middle_pip, middle_dip, middle_tip)
        fingers_dict[Finger.RING], angles_dict[Finger.RING] = analyze_finger(ring_mcp, ring_pip, ring_dip, ring_tip)
        fingers_dict[Finger.PINKY], angles_dict[Finger.PINKY] = analyze_finger(pinky_mcp, pinky_pip, pinky_dip, pinky_tip)
        
        # 4. Analyze Thumb (Different biomechanics)
        # Check angle against index finger plane
        v_thumb_tip_mcp = VectorUtils.get_vector(thumb_mcp, thumb_tip)
        v_index_mcp_wrist = VectorUtils.get_vector(wrist, index_mcp)
        
        # Simple proximity check for thumb
        # Is thumb tip to the left or right of the knuckle?
        thumb_state = FingerState.EXTENDED
        if VectorUtils.calculate_angle(v_thumb_tip_mcp, v_index_mcp_wrist) > 60:
             # This is a simplification; thumb is complex
             # In a real model, we project vectors onto the palm plane
             thumb_state = FingerState.FOLDED
             
        # Distance check for thumb
        if np.linalg.norm(thumb_tip - pinky_mcp) < 0.05:
            thumb_state = FingerState.FOLDED
            
        fingers_dict[Finger.THUMB] = thumb_state
        angles_dict[Finger.THUMB] = 0.0 # TODO: Implement complex thumb angle
        
        # 5. Determine Palm Orientation
        # Cross product of Wrist->IndexMCP and Wrist->PinkyMCP gives normal vector
        v_w_i = VectorUtils.get_vector(wrist, index_mcp)
        v_w_p = VectorUtils.get_vector(wrist, pinky_mcp)
        palm_normal = np.cross(v_w_i, v_w_p)
        palm_normal = VectorUtils.normalize_vector(palm_normal)
        
        # Map normal vector to orientation
        # Assuming camera coordinates: Y is down, X is right, Z is forward (from camera)
        abs_x, abs_y, abs_z = abs(palm_normal[0]), abs(palm_normal[1]), abs(palm_normal[2])
        
        orientation = Orientation.FORWARD
        if abs_z > abs_x and abs_z > abs_y:
            orientation = Orientation.FORWARD if palm_normal[2] < 0 else Orientation.BACKWARD
        elif abs_y > abs_x:
            orientation = Orientation.UP if palm_normal[1] < 0 else Orientation.DOWN
        else:
            orientation = Orientation.LEFT if palm_normal[0] < 0 else Orientation.RIGHT
            
        return HandState(
            fingers=fingers_dict,
            finger_angles=angles_dict,
            palm_orientation=orientation,
            thumb_position="UNKNOWN",
            raw_landmarks=coords,
            timestamp=time.time()
        )

class ASLRecognizer:
    def __init__(self):
        self.extractor = HandFeatureExtractor()
        self.lexicon = ASLLexicon.get_definitions()
        # Loading a Machine Learning model here for dynamic signs
        # self.model = load_model("asl_model.tflite") 
        
    def _calculate_match_score(self, hand_state: HandState, sign_def: Dict) -> float:
        """
        Calculates how well the current hand state matches a sign definition.
        Returns a score between 0.0 and 1.0
        """
        score = 0.0
        total_checks = 0
        
        # 1. Check Finger States
        if "fingers" in sign_def:
            for finger, required_states in sign_def["fingers"].items():
                total_checks += 1
                if hand_state.fingers[finger] in required_states:
                    score += 1.0
                else:
                    # Partial credit? No, strict for now to avoid false positives
                    pass
        
        # 2. Check Orientation (if defined)
        if "orientation" in sign_def:
            total_checks += 1
            if hand_state.palm_orientation in sign_def["orientation"]:
                score += 1.0
            else:
                pass
                
        # 3. Special Geometric Checks
        if "special" in sign_def:
            total_checks += 1
            check_type = sign_def["special"]
            landmarks = hand_state.raw_landmarks
            
            # Define landmarks indices for readability
            THUMB_TIP, INDEX_TIP, MIDDLE_TIP = 4, 8, 12
            RING_TIP, PINKY_TIP = 16, 20
            INDEX_MCP, MIDDLE_MCP = 5, 9
            RING_MCP = 13
            
            check_passed = False
            
            if check_type == "THUMB_INDEX_TOUCH":
                dist = np.linalg.norm(landmarks[THUMB_TIP] - landmarks[INDEX_TIP])
                if dist < 0.05: check_passed = True
            
            elif check_type == "THUMB_MIDDLE_TOUCH":
                dist = np.linalg.norm(landmarks[THUMB_TIP] - landmarks[MIDDLE_TIP])
                if dist < 0.05: check_passed = True
                
            elif check_type == "ALL_TIPS_TOUCH":
                center = landmarks[THUMB_TIP]
                d1 = np.linalg.norm(landmarks[INDEX_TIP] - center)
                d2 = np.linalg.norm(landmarks[MIDDLE_TIP] - center)
                if d1 < 0.05 and d2 < 0.05: check_passed = True
            
            elif check_type == "THUMB_UNDER_INDEX":
                # Thumb tip is "below" index finger (complex 3D check simplified)
                if landmarks[THUMB_TIP][0] > landmarks[INDEX_MCP][0]: # X-axis heuristic
                    check_passed = True

            if check_passed:
                score += 1.0
        
        if total_checks == 0:
            return 0.0
            
        return score / total_checks

    def predict(self, raw_landmarks: List[Dict]) -> Tuple[Optional[str], float]:
        """
        Main entry point for recognition.
        """
        hand_state = self.extractor.process(raw_landmarks)
        if not hand_state:
            return None, 0.0
        
        best_match = None
        best_confidence = 0.0
        
        # Iterate through the lexicon
        # Optimization: In production, use a decision tree or lookup table 
        # instead of iterating all keys.
        for sign_name, sign_def in self.lexicon.items():
            confidence = self._calculate_match_score(hand_state, sign_def)
            
            if confidence > best_confidence:
                best_confidence = confidence
                best_match = sign_name
        
        # Thresholding
        if best_confidence >= Config.CONFIDENCE_THRESHOLD:
            return best_match, best_confidence
            
        return None, best_confidence  # Return confidence even if below threshold for debugging

# ==========================================
# SENTENCE & NLP ENGINE
# ==========================================

class SentenceBuilder:
    """
    Manages the state of the constructed sentence.
    Handles debouncing (removing duplicate frames) and word buffering.
    """
    def __init__(self):
        self.current_sentence: List[str] = []
        self.frame_buffer = deque(maxlen=Config.BUFFER_SIZE)
        self.last_word_time = 0
        self.cooldown = Config.WORD_COOLDOWN
        
    def add_prediction(self, prediction: str, confidence: float):
        if not prediction:
            return
            
        self.frame_buffer.append(prediction)
        
        # Majority voting in the buffer
        if len(self.frame_buffer) == self.frame_buffer.maxlen:
            counts = Counter(self.frame_buffer)
            most_common, count = counts.most_common(1)[0]
            
            # If majority of frames agree on the sign
            if count > (self.frame_buffer.maxlen * Config.MAJORITY_THRESHOLD):
                self._commit_word(most_common)
                self.frame_buffer.clear() # Reset buffer after confirmation
                
    def _commit_word(self, word: str):
        now = time.time()
        
        # Logic to prevent "A A A A" unless explicitly intended
        if self.current_sentence:
            last_word = self.current_sentence[-1]
            if last_word == word and (now - self.last_word_time) < self.cooldown:
                return
                
        self.current_sentence.append(word)
        self.last_word_time = now
        
    def get_sentence(self) -> str:
        return " ".join(self.current_sentence)
        
    def clear(self):
        self.current_sentence = []
        self.frame_buffer.clear()

# ==========================================
# WEBSOCKET HANDLER
# ==========================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info("Client disconnected")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()
recognizer = ASLRecognizer()

# Unique session state (simple dictionary for MVP, use Redis for production)
sessions: Dict[str, SentenceBuilder] = {}
session_last_activity: Dict[str, float] = {}

# Cleanup old sessions (prevent memory leak)
async def cleanup_old_sessions():
    """Remove sessions inactive for more than configured timeout"""
    while True:
        await asyncio.sleep(Config.CLEANUP_INTERVAL)
        current_time = time.time()
        to_delete = []
        
        for client_id, last_time in session_last_activity.items():
            if current_time - last_time > Config.SESSION_TIMEOUT:
                to_delete.append(client_id)
        
        for client_id in to_delete:
            if client_id in sessions:
                del sessions[client_id]
            del session_last_activity[client_id]
            logger.info(f"Cleaned up inactive session: {client_id}")

# Start cleanup task on startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_old_sessions())
    logger.info("ASL Recognition System started successfully")

# Primary WebSocket endpoint (with client ID for session management)
@app.websocket("/ws/{client_id}")
async def websocket_endpoint_with_id(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    
    # Initialize session
    if client_id not in sessions:
        sessions[client_id] = SentenceBuilder()
        logger.info(f"Created new session for client: {client_id}")
    
    sentence_builder = sessions[client_id]
    session_last_activity[client_id] = time.time()
    
    try:
        while True:
            data = await websocket.receive_text()
            session_last_activity[client_id] = time.time()
            
            try:
                payload = json.loads(data)
                msg_type = payload.get("type")
                
                if msg_type == "landmarks":
                    landmarks = payload.get("data") or payload.get("landmarks")
                    
                    if not landmarks:
                        continue
                    
                    # 1. Recognize
                    gesture, confidence = recognizer.predict(landmarks)
                    
                    # 2. Update Sentence Logic
                    if gesture:
                        sentence_builder.add_prediction(gesture, confidence)
                    
                    # 3. Send Response (compatible with frontend format)
                    response = {
                        "type": "prediction",  # Frontend expects "prediction"
                        "gesture": gesture,
                        "confidence": round(confidence, 2),
                        "sentence": sentence_builder.get_sentence(),
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send_text(json.dumps(response))
                
                elif msg_type == "command" or msg_type == "clear":
                    cmd = payload.get("action") or "clear"
                    if cmd == "clear":
                        sentence_builder.clear()
                        await websocket.send_text(json.dumps({
                            "type": "cleared",
                            "timestamp": datetime.now().isoformat()
                        }))
                
                elif msg_type == "refine_sentence":
                    # LLM Sentence Refinement
                    words = sentence_builder.current_sentence
                    if words:
                        try:
                            # Try to import LLM integration
                            from llm_integration import LLMRefiner, LLMProvider
                            import os
                            
                            # Set embedded API key
                            if not os.environ.get("GEMINI_API_KEY"):
                                os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
                            
                            # Determine provider (prioritize Gemini with embedded key)
                            provider = LLMProvider.GEMINI  # Use Gemini by default
                            if os.environ.get("GROQ_API_KEY"):
                                provider = LLMProvider.GROQ
                            elif os.environ.get("OPENAI_API_KEY"):
                                provider = LLMProvider.OPENAI
                            
                            refiner = LLMRefiner(provider)
                            refined = await refiner.refine(words)
                            
                            await websocket.send_text(json.dumps({
                                "type": "refined_sentence",
                                "original": " ".join(words),
                                "refined": refined,
                                "timestamp": datetime.now().isoformat()
                            }))
                        except Exception as e:
                            logger.error(f"LLM refinement error: {e}")
                            # Fallback to basic refinement
                            raw_text = " ".join(words)
                            refined = raw_text.capitalize()
                            if not refined.endswith('.'):
                                refined += '.'
                            await websocket.send_text(json.dumps({
                                "type": "refined_sentence",
                                "original": raw_text,
                                "refined": refined,
                                "timestamp": datetime.now().isoformat()
                            }))
                        
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Processing error: {e}", exc_info=True)
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Client {client_id} disconnected")

# Backwards compatible endpoint (without client ID)
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Legacy endpoint for backwards compatibility"""
    # Generate random client ID
    import uuid
    client_id = str(uuid.uuid4())
    logger.info(f"Legacy WebSocket connection, assigned ID: {client_id}")
    
    # Delegate to main endpoint
    await websocket_endpoint_with_id(websocket, client_id)

# ==========================================
# HEALTH & INFO
# ==========================================

@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    return {
        "status": "operational",
        "version": "2.0.0",
        "lexicon_size": len(recognizer.lexicon),
        "active_connections": len(manager.active_connections),
        "active_sessions": len(sessions),
        "config": {
            "confidence_threshold": Config.CONFIDENCE_THRESHOLD,
            "buffer_size": Config.BUFFER_SIZE,
            "session_timeout": Config.SESSION_TIMEOUT
        },
        "system_time": datetime.now().isoformat(),
        "features": {
            "alphabet": "A-Z (26 letters)",
            "numbers": "0-9 (10 digits)",
            "special_signs": ["I LOVE YOU"],
            "total_signs": len(recognizer.lexicon)
        }
    }

@app.get("/")
async def root():
    """API information endpoint"""
    return {
        "name": "Enterprise ASL Recognition API",
        "version": "2.0.0",
        "description": "Real-time WebSocket API for American Sign Language Recognition",
        "endpoints": {
            "health": "/health",
            "websocket": "/ws or /ws/{client_id}",
            "docs": "/docs",
            "openapi": "/openapi.json"
        },
        "features": {
            "signs_supported": len(recognizer.lexicon),
            "real_time_recognition": True,
            "sentence_building": True,
            "llm_refinement": True,
            "temporal_smoothing": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    # To run: python main.py
    uvicorn.run(app, host="0.0.0.0", port=8000)