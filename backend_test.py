#!/usr/bin/env python3
"""
Comprehensive backend test for Gemini integration.
Tests the OpenAI → Google Gemini swap.
"""

import requests
import json
import io
import os

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://summarize-meetings-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

print(f"Testing against: {BASE_URL}")
print(f"API base: {API_BASE}")
print("=" * 80)

# Track all responses for security checks
all_responses = []

def test_homepage():
    """Test 1: GET / → 200 with 'AI Meeting Summarizer'"""
    print("\n[TEST 1] GET / - Homepage")
    try:
        resp = requests.get(BASE_URL, timeout=10)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        
        if resp.status_code == 200:
            if "AI Meeting Summarizer" in resp.text:
                print("  ✅ PASS: Homepage returns 200 with 'AI Meeting Summarizer'")
                return True
            else:
                print("  ❌ FAIL: Homepage missing 'AI Meeting Summarizer' text")
                return False
        else:
            print(f"  ❌ FAIL: Expected 200, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_transcribe_no_file():
    """Test 2a: POST /api/transcribe - no multipart / no file → 400"""
    print("\n[TEST 2a] POST /api/transcribe - no file")
    try:
        # Test with no body
        resp = requests.post(f"{API_BASE}/transcribe", timeout=10)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        
        if resp.status_code == 400:
            body = resp.json()
            if body.get('error'):
                print(f"  ✅ PASS: Returns 400 with error message")
                return True
            else:
                print(f"  ❌ FAIL: 400 but no error message")
                return False
        else:
            print(f"  ❌ FAIL: Expected 400, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_transcribe_empty_file():
    """Test 2b: POST /api/transcribe - 0-byte file → 400 with 'empty'"""
    print("\n[TEST 2b] POST /api/transcribe - empty file")
    try:
        files = {'file': ('empty.mp3', io.BytesIO(b''), 'audio/mpeg')}
        resp = requests.post(f"{API_BASE}/transcribe", files=files, timeout=10)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        
        if resp.status_code == 400:
            body = resp.json()
            error = body.get('error', '').lower()
            if 'empty' in error:
                print(f"  ✅ PASS: Returns 400 with 'empty' in error message")
                return True
            else:
                print(f"  ❌ FAIL: 400 but wrong error message")
                return False
        else:
            print(f"  ❌ FAIL: Expected 400, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_transcribe_text_file():
    """Test 2c: POST /api/transcribe - text file → 415 'Unsupported file type'"""
    print("\n[TEST 2c] POST /api/transcribe - text file")
    try:
        files = {'file': ('note.txt', io.BytesIO(b'This is a text file'), 'text/plain')}
        resp = requests.post(f"{API_BASE}/transcribe", files=files, timeout=10)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        
        if resp.status_code == 415:
            body = resp.json()
            error = body.get('error', '').lower()
            if 'unsupported' in error or 'file type' in error:
                print(f"  ✅ PASS: Returns 415 with 'Unsupported file type'")
                return True
            else:
                print(f"  ❌ FAIL: 415 but wrong error message")
                return False
        else:
            print(f"  ❌ FAIL: Expected 415, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_transcribe_real_audio():
    """Test 2d: POST /api/transcribe - real audio file"""
    print("\n[TEST 2d] POST /api/transcribe - real audio file (/tmp/sample.mp3)")
    try:
        if not os.path.exists('/tmp/sample.mp3'):
            print("  ⚠️  SKIP: /tmp/sample.mp3 not found")
            return None
        
        with open('/tmp/sample.mp3', 'rb') as f:
            files = {'file': ('sample.mp3', f, 'audio/mpeg')}
            resp = requests.post(f"{API_BASE}/transcribe", files=files, timeout=120)
        
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text[:200]}...")
        
        # Check for different outcomes based on GEMINI_API_KEY state
        if resp.status_code == 500:
            body = resp.json()
            error = body.get('error', '')
            expected_msg = "Server is missing the GEMINI_API_KEY environment variable. Please configure it and restart the server."
            if error == expected_msg:
                print(f"  ✅ PASS: Returns 500 with EXACT missing-key message (GEMINI_API_KEY not set)")
                return True
            else:
                print(f"  ❌ FAIL: 500 but wrong error message")
                print(f"  Expected: {expected_msg}")
                print(f"  Got: {error}")
                return False
        elif resp.status_code == 200:
            body = resp.json()
            if 'transcript' in body and body['transcript']:
                print(f"  ✅ PASS: Returns 200 with transcript (GEMINI_API_KEY is set and working)")
                return True
            else:
                print(f"  ❌ FAIL: 200 but no transcript in response")
                return False
        elif resp.status_code == 429:
            body = resp.json()
            error = body.get('error', '').lower()
            if 'quota' in error or 'rate limit' in error:
                print(f"  ✅ PASS: Returns 429 with quota message (GEMINI_API_KEY set but quota exhausted)")
                return True
            else:
                print(f"  ❌ FAIL: 429 but no quota message")
                return False
        elif resp.status_code == 401:
            body = resp.json()
            error = body.get('error', '').lower()
            if 'gemini' in error and ('api key' in error or 'rejected' in error):
                print(f"  ✅ PASS: Returns 401 with key rejection message (invalid GEMINI_API_KEY)")
                return True
            else:
                print(f"  ❌ FAIL: 401 but wrong error message")
                return False
        else:
            print(f"  ❌ FAIL: Unexpected status code {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_summarize_non_json():
    """Test 3a: POST /api/summarize - non-JSON body → 400 'Invalid JSON body.'"""
    print("\n[TEST 3a] POST /api/summarize - non-JSON body")
    try:
        resp = requests.post(f"{API_BASE}/summarize", data="not json", timeout=10)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        
        if resp.status_code == 400:
            body = resp.json()
            error = body.get('error', '')
            if 'Invalid JSON body' in error or 'invalid json' in error.lower():
                print(f"  ✅ PASS: Returns 400 with 'Invalid JSON body.'")
                return True
            else:
                print(f"  ❌ FAIL: 400 but wrong error message")
                return False
        else:
            print(f"  ❌ FAIL: Expected 400, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_summarize_empty_object():
    """Test 3b: POST /api/summarize - {} → 400 'Transcript is required.'"""
    print("\n[TEST 3b] POST /api/summarize - empty object")
    try:
        resp = requests.post(f"{API_BASE}/summarize", json={}, timeout=10)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        
        if resp.status_code == 400:
            body = resp.json()
            error = body.get('error', '')
            if 'Transcript is required' in error or 'transcript' in error.lower():
                print(f"  ✅ PASS: Returns 400 with 'Transcript is required.'")
                return True
            else:
                print(f"  ❌ FAIL: 400 but wrong error message")
                return False
        else:
            print(f"  ❌ FAIL: Expected 400, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_summarize_whitespace():
    """Test 3c: POST /api/summarize - whitespace transcript → 400 'Transcript is required.'"""
    print("\n[TEST 3c] POST /api/summarize - whitespace transcript")
    try:
        resp = requests.post(f"{API_BASE}/summarize", json={"transcript": "   "}, timeout=10)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        
        if resp.status_code == 400:
            body = resp.json()
            error = body.get('error', '')
            if 'Transcript is required' in error or 'transcript' in error.lower():
                print(f"  ✅ PASS: Returns 400 with 'Transcript is required.'")
                return True
            else:
                print(f"  ❌ FAIL: 400 but wrong error message")
                return False
        else:
            print(f"  ❌ FAIL: Expected 400, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_summarize_valid_transcript():
    """Test 3d: POST /api/summarize - valid transcript"""
    print("\n[TEST 3d] POST /api/summarize - valid transcript")
    try:
        transcript = "Alice will send the Q3 report by Friday. Bob agreed to review it. We decided to move the beta launch to Aug 15. Priya to prepare marketing deck."
        resp = requests.post(f"{API_BASE}/summarize", json={"transcript": transcript}, timeout=120)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text[:300]}...")
        
        # Check for different outcomes based on GEMINI_API_KEY state
        if resp.status_code == 500:
            body = resp.json()
            error = body.get('error', '')
            expected_msg = "Server is missing the GEMINI_API_KEY environment variable. Please configure it and restart the server."
            if error == expected_msg:
                print(f"  ✅ PASS: Returns 500 with EXACT missing-key message (GEMINI_API_KEY not set)")
                return True
            else:
                print(f"  ❌ FAIL: 500 but wrong error message")
                print(f"  Expected: {expected_msg}")
                print(f"  Got: {error}")
                return False
        elif resp.status_code == 200:
            body = resp.json()
            required_keys = ['summary', 'key_topics', 'key_decisions', 'action_items', 'important_notes']
            if all(key in body for key in required_keys):
                # Check action_items structure
                if isinstance(body['action_items'], list):
                    if len(body['action_items']) > 0:
                        item = body['action_items'][0]
                        if all(k in item for k in ['task', 'owner', 'deadline']):
                            print(f"  ✅ PASS: Returns 200 with all required keys and correct structure")
                            return True
                        else:
                            print(f"  ❌ FAIL: action_items missing required keys (task/owner/deadline)")
                            return False
                    else:
                        print(f"  ✅ PASS: Returns 200 with all required keys (empty action_items is OK)")
                        return True
                else:
                    print(f"  ❌ FAIL: action_items is not a list")
                    return False
            else:
                missing = [k for k in required_keys if k not in body]
                print(f"  ❌ FAIL: Missing required keys: {missing}")
                return False
        elif resp.status_code == 429:
            body = resp.json()
            error = body.get('error', '').lower()
            if 'quota' in error or 'rate limit' in error:
                print(f"  ✅ PASS: Returns 429 with quota message (GEMINI_API_KEY set but quota exhausted)")
                return True
            else:
                print(f"  ❌ FAIL: 429 but no quota message")
                return False
        elif resp.status_code == 401:
            body = resp.json()
            error = body.get('error', '').lower()
            if 'gemini' in error and ('api key' in error or 'rejected' in error):
                print(f"  ✅ PASS: Returns 401 with key rejection message (invalid GEMINI_API_KEY)")
                return True
            else:
                print(f"  ❌ FAIL: 401 but wrong error message")
                return False
        else:
            print(f"  ❌ FAIL: Unexpected status code {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_summarize_too_long():
    """Test 3e: POST /api/summarize - transcript >120000 chars → 413 'too long'"""
    print("\n[TEST 3e] POST /api/summarize - too long transcript")
    try:
        long_transcript = "x" * 121000
        resp = requests.post(f"{API_BASE}/summarize", json={"transcript": long_transcript}, timeout=10)
        all_responses.append(resp.text)
        print(f"  Status: {resp.status_code}")
        print(f"  Body: {resp.text}")
        
        if resp.status_code == 413:
            body = resp.json()
            error = body.get('error', '').lower()
            if 'too long' in error or 'shorten' in error:
                print(f"  ✅ PASS: Returns 413 with 'too long' message")
                return True
            else:
                print(f"  ❌ FAIL: 413 but wrong error message")
                return False
        else:
            print(f"  ❌ FAIL: Expected 413, got {resp.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_security_no_api_keys():
    """Test 4: Security - no API keys in responses"""
    print("\n[TEST 4a] Security - No API keys in responses")
    try:
        all_text = " ".join(all_responses)
        
        # Check for Gemini API key prefix
        if "AIza" in all_text:
            print(f"  ❌ FAIL: Found 'AIza' (Gemini API key prefix) in responses")
            return False
        else:
            print(f"  ✅ PASS: No 'AIza' pattern found in responses")
        
        # Check for OpenAI API key prefix (sanity check)
        if "sk-" in all_text and "mask-image" not in all_text:
            print(f"  ❌ FAIL: Found 'sk-' (OpenAI API key prefix) in responses")
            return False
        else:
            print(f"  ✅ PASS: No 'sk-' pattern found in responses (excluding CSS)")
        
        return True
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_security_no_stack_traces():
    """Test 4b: Security - no Node.js stack traces"""
    print("\n[TEST 4b] Security - No Node.js stack traces")
    try:
        # Only check error responses (skip homepage which has webpack artifacts)
        error_responses = [r for r in all_responses[1:]]  # Skip first response (homepage)
        all_text = " ".join(error_responses)
        
        # Check for actual stack trace patterns (not just "node_modules" in webpack)
        # Real stack traces have "at " followed by function/file info
        stack_patterns = [
            "at Object.",
            "at Function.",
            "at async ",
            "at Module.",
            "at file://",
            "    at ",  # Indented stack trace line
        ]
        
        found_traces = []
        for pattern in stack_patterns:
            if pattern in all_text:
                found_traces.append(pattern)
        
        # Also check for file paths in error messages (which would indicate stack trace leak)
        if "/app/app/api/" in all_text or "/app/lib/" in all_text:
            found_traces.append("file paths")
        
        if found_traces:
            print(f"  ❌ FAIL: Found stack trace patterns: {found_traces}")
            return False
        else:
            print(f"  ✅ PASS: No Node.js stack traces found in error responses")
            return True
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_security_no_hardcoded_keys():
    """Test 4c: Security - no hardcoded keys in source files"""
    print("\n[TEST 4c] Security - No hardcoded keys in source files")
    try:
        # Check for AIza in source files
        result = os.popen("grep -r 'AIza' /app/app/ /app/lib/ /app/components/ 2>/dev/null").read()
        if result.strip():
            print(f"  ❌ FAIL: Found 'AIza' in source files:")
            print(f"  {result}")
            return False
        else:
            print(f"  ✅ PASS: No 'AIza' pattern in source files")
        
        # Check for sk- in source files (excluding CSS mask-image)
        result = os.popen("grep -r 'sk-' /app/app/ /app/lib/ /app/components/ 2>/dev/null | grep -v 'mask-image' | grep -v '.next' | grep -v 'node_modules'").read()
        if result.strip():
            print(f"  ❌ FAIL: Found 'sk-' in source files:")
            print(f"  {result}")
            return False
        else:
            print(f"  ✅ PASS: No 'sk-' pattern in source files (excluding CSS)")
        
        return True
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def test_cross_file_audit():
    """Test 5: Cross-file audit"""
    print("\n[TEST 5] Cross-file audit")
    try:
        # Check that /app/lib/openai.js does NOT exist
        if os.path.exists('/app/lib/openai.js'):
            print(f"  ❌ FAIL: /app/lib/openai.js still exists (should be deleted)")
            return False
        else:
            print(f"  ✅ PASS: /app/lib/openai.js does not exist (correctly deleted)")
        
        # Check that /app/lib/gemini.js exists
        if not os.path.exists('/app/lib/gemini.js'):
            print(f"  ❌ FAIL: /app/lib/gemini.js does not exist")
            return False
        else:
            print(f"  ✅ PASS: /app/lib/gemini.js exists")
        
        # Check for imports from @/lib/openai
        result = os.popen("grep -r \"from '@/lib/openai'\" /app/app/ /app/lib/ /app/components/ 2>/dev/null").read()
        if result.strip():
            print(f"  ❌ FAIL: Found imports from @/lib/openai:")
            print(f"  {result}")
            return False
        else:
            print(f"  ✅ PASS: No imports from @/lib/openai found")
        
        # Check that routes import from @/lib/gemini
        result = os.popen("grep -r \"from '@/lib/gemini'\" /app/app/api/ 2>/dev/null").read()
        if not result.strip():
            print(f"  ❌ FAIL: No imports from @/lib/gemini found in API routes")
            return False
        else:
            print(f"  ✅ PASS: API routes import from @/lib/gemini")
        
        return True
    except Exception as e:
        print(f"  ❌ FAIL: Exception: {e}")
        return False

def main():
    """Run all tests and report results"""
    print("\n" + "=" * 80)
    print("GEMINI INTEGRATION TEST SUITE")
    print("=" * 80)
    
    results = []
    
    # Run all tests
    results.append(("Homepage", test_homepage()))
    results.append(("Transcribe - no file", test_transcribe_no_file()))
    results.append(("Transcribe - empty file", test_transcribe_empty_file()))
    results.append(("Transcribe - text file", test_transcribe_text_file()))
    results.append(("Transcribe - real audio", test_transcribe_real_audio()))
    results.append(("Summarize - non-JSON", test_summarize_non_json()))
    results.append(("Summarize - empty object", test_summarize_empty_object()))
    results.append(("Summarize - whitespace", test_summarize_whitespace()))
    results.append(("Summarize - valid transcript", test_summarize_valid_transcript()))
    results.append(("Summarize - too long", test_summarize_too_long()))
    results.append(("Security - no API keys", test_security_no_api_keys()))
    results.append(("Security - no stack traces", test_security_no_stack_traces()))
    results.append(("Security - no hardcoded keys", test_security_no_hardcoded_keys()))
    results.append(("Cross-file audit", test_cross_file_audit()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result is True)
    failed = sum(1 for _, result in results if result is False)
    skipped = sum(1 for _, result in results if result is None)
    total = len(results)
    
    for name, result in results:
        if result is True:
            print(f"✅ {name}")
        elif result is False:
            print(f"❌ {name}")
        else:
            print(f"⚠️  {name} (SKIPPED)")
    
    print("\n" + "=" * 80)
    print(f"TOTAL: {passed}/{total} passed, {failed}/{total} failed, {skipped}/{total} skipped")
    print("=" * 80)
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
