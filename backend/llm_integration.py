"""
LLM Integration Module for ASL Sentence Refinement
Supports multiple LLM providers: Groq, Gemini, OpenAI, and Language Tool
"""

import os
from typing import Optional, List
from enum import Enum

class LLMProvider(Enum):
    GROQ = "groq"
    GEMINI = "gemini"
    OPENAI = "openai"
    LANGUAGE_TOOL = "language_tool"
    NONE = "none"


class LLMRefiner:
    """
    Refines ASL word sequences into grammatically correct sentences
    using various LLM providers
    """
    
    def __init__(self, provider: LLMProvider = LLMProvider.NONE):
        self.provider = provider
        self.client = None
        self._initialize_provider()
    
    def _initialize_provider(self):
        """Initialize the selected LLM provider"""
        try:
            if self.provider == LLMProvider.GROQ:
                from groq import Groq
                api_key = os.environ.get("GROQ_API_KEY")
                if not api_key:
                    print("Warning: GROQ_API_KEY not found. Using fallback.")
                    self.provider = LLMProvider.NONE
                    return
                self.client = Groq(api_key=api_key)
                print("✓ Groq API initialized")
            
            elif self.provider == LLMProvider.GEMINI:
                import google.generativeai as genai
                # API key embedded in code
                api_key = os.environ.get("GEMINI_API_KEY") or "AIzaSyBMlLMXILt7mHhKQttsqWg_EckZy-3gfk8"
                if not api_key:
                    print("Warning: GEMINI_API_KEY not found. Using fallback.")
                    self.provider = LLMProvider.NONE
                    return
                genai.configure(api_key=api_key)
                self.client = genai.GenerativeModel('gemini-pro')
                print("✓ Gemini API initialized")
            
            elif self.provider == LLMProvider.OPENAI:
                from openai import OpenAI
                api_key = os.environ.get("OPENAI_API_KEY")
                if not api_key:
                    print("Warning: OPENAI_API_KEY not found. Using fallback.")
                    self.provider = LLMProvider.NONE
                    return
                self.client = OpenAI(api_key=api_key)
                print("✓ OpenAI API initialized")
            
            elif self.provider == LLMProvider.LANGUAGE_TOOL:
                import language_tool_python
                self.client = language_tool_python.LanguageTool('en-US')
                print("✓ Language Tool initialized")
            
            else:
                print("ℹ Using basic text formatting (no LLM)")
        
        except ImportError as e:
            print(f"Warning: Could not import {self.provider.value}: {e}")
            print("Falling back to basic formatting. Install required package:")
            print(f"  pip install {self._get_package_name()}")
            self.provider = LLMProvider.NONE
        except Exception as e:
            print(f"Error initializing {self.provider.value}: {e}")
            self.provider = LLMProvider.NONE
    
    def _get_package_name(self) -> str:
        """Get the pip package name for the provider"""
        packages = {
            LLMProvider.GROQ: "groq",
            LLMProvider.GEMINI: "google-generativeai",
            LLMProvider.OPENAI: "openai",
            LLMProvider.LANGUAGE_TOOL: "language-tool-python"
        }
        return packages.get(self.provider, "unknown")
    
    async def refine(self, words: List[str]) -> str:
        """
        Refine a list of ASL words into a grammatically correct sentence
        
        Args:
            words: List of detected ASL words/signs
        
        Returns:
            Refined grammatically correct sentence
        """
        if not words:
            return ""
        
        raw_text = " ".join(words)
        
        try:
            if self.provider == LLMProvider.GROQ:
                return await self._refine_with_groq(raw_text)
            elif self.provider == LLMProvider.GEMINI:
                return await self._refine_with_gemini(raw_text)
            elif self.provider == LLMProvider.OPENAI:
                return await self._refine_with_openai(raw_text)
            elif self.provider == LLMProvider.LANGUAGE_TOOL:
                return await self._refine_with_language_tool(raw_text)
            else:
                return self._basic_refinement(raw_text)
        except Exception as e:
            print(f"Error during refinement: {e}")
            return self._basic_refinement(raw_text)
    
    async def _refine_with_groq(self, text: str) -> str:
        """Refine using Groq API"""
        response = self.client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an ASL (American Sign Language) translator. "
                        "Convert ASL word sequences into proper, grammatically correct English sentences. "
                        "ASL has different grammar from English - signs may be in different order, "
                        "lack articles (a, an, the), and use different word forms. "
                        "Return ONLY the refined sentence, nothing else."
                    )
                },
                {
                    "role": "user",
                    "content": f"Convert this ASL sequence to proper English: {text}"
                }
            ],
            temperature=0.3,
            max_tokens=200
        )
        return response.choices[0].message.content.strip()
    
    async def _refine_with_gemini(self, text: str) -> str:
        """Refine using Google Gemini API"""
        prompt = (
            f"Convert this American Sign Language (ASL) word sequence into a "
            f"grammatically correct English sentence. ASL grammar differs from English. "
            f"Return only the refined sentence:\n\n{text}"
        )
        response = self.client.generate_content(prompt)
        return response.text.strip()
    
    async def _refine_with_openai(self, text: str) -> str:
        """Refine using OpenAI API"""
        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an ASL translator. Convert ASL word sequences into "
                        "proper English sentences. Return only the refined sentence."
                    )
                },
                {
                    "role": "user",
                    "content": f"Convert: {text}"
                }
            ],
            temperature=0.3,
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    
    async def _refine_with_language_tool(self, text: str) -> str:
        """Refine using Language Tool (grammar checking)"""
        # Convert to lowercase and add basic structure
        formatted = text.lower()
        
        # Add common ASL to English conversions
        replacements = {
            "me go": "I go",
            "me": "I",
            "you me": "you and I",
        }
        
        for asl, english in replacements.items():
            formatted = formatted.replace(asl, english)
        
        # Use Language Tool for grammar correction
        corrected = self.client.correct(formatted)
        
        # Capitalize first letter
        if corrected:
            corrected = corrected[0].upper() + corrected[1:]
        
        # Ensure it ends with punctuation
        if corrected and corrected[-1] not in '.!?':
            corrected += '.'
        
        return corrected
    
    def _basic_refinement(self, text: str) -> str:
        """
        Basic refinement without LLM
        Just capitalizes and adds punctuation
        """
        if not text:
            return ""
        
        # Convert to lowercase
        refined = text.lower()
        
        # Basic ASL to English conversions
        replacements = {
            " me ": " I ",
            "me go": "I go",
            "me want": "I want",
            "me need": "I need",
            "you me": "you and I",
        }
        
        for asl, english in replacements.items():
            refined = refined.replace(asl, english)
        
        # Capitalize first letter
        refined = refined[0].upper() + refined[1:] if refined else ""
        
        # Add period if missing
        if refined and refined[-1] not in '.!?':
            refined += '.'
        
        return refined


# Example usage
async def main():
    """Test the LLM refiner"""
    
    # Test with different providers
    providers = [
        LLMProvider.GROQ,
        LLMProvider.GEMINI,
        LLMProvider.LANGUAGE_TOOL,
        LLMProvider.NONE
    ]
    
    test_words = ["ME", "GO", "STORE", "TOMORROW"]
    
    print("Testing LLM Refinement")
    print("=" * 50)
    print(f"Input: {' '.join(test_words)}\n")
    
    for provider in providers:
        refiner = LLMRefiner(provider)
        result = await refiner.refine(test_words)
        print(f"{provider.value:15} → {result}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

