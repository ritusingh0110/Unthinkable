#!/usr/bin/env python3
"""
Backend API Test Suite for AI Meeting Summarizer - FINAL VERIFICATION
Tests all validation paths, error handling, and OpenAI integration states
"""

import requests
import io
import os

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://summarize-meetings-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

print(f"Testing against: {API_BASE}")
print("=" * 80)

# Test counters
total_tests = 0
passed_tests = 0
failed_tests = 0

# Track OpenAI state
openai_state = "unknown"  # Will be: "no_key", "key_quota_ok", or "key_quota_exceeded"

def test_result(name, passed, details=""):
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    if passed:
        passed_tests += 1
        print(f"✅ PASS: {name}")
    else:
        failed_tests += 1
        print(f"❌ FAIL: {name}")
    if details:
        print(f"   {details}")
    print()

# ============================================================================
# TEST 1: Homepage
# ============================================================================
print("\n" + "=" * 80)
print("TEST 1: GET / (Homepage)")
print("=" * 80)

try:
    response = requests.get(BASE_URL, timeout=10)
    status_ok = response.status_code == 200
    content_ok = "AI Meeting Summarizer" in response.text
    
    if status_ok and content_ok:
        test_result("Homepage returns 200 with 'AI Meeting Summarizer'", True, 
                   f"Status: {response.status_code}")
    else:
        test_result("Homepage returns 200 with 'AI Meeting Summarizer'", False,
                   f"Status: {response.status_code}, Content check: {content_ok}")
except Exception as e:
    test_result("Homepage returns 200 with 'AI Meeting Summarizer'", False, f"Error: {str(e)}")

# ============================================================================
# TEST 2a: POST /api/transcribe - No multipart / no file field
# ============================================================================
print("\n" + "=" * 80)
print("TEST 2a: POST /api/transcribe - No multipart / no file field")
print("=" * 80)

try:
    response = requests.post(f"{API_BASE}/transcribe", timeout=10)
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = len(error_msg) > 0  # Just needs non-empty error message
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("No multipart → 400 with error message", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("No multipart → 400 with error message", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("No multipart → 400 with error message", False, f"Error: {str(e)}")

# ============================================================================
# TEST 2b: POST /api/transcribe - Empty file (0 bytes)
# ============================================================================
print("\n" + "=" * 80)
print("TEST 2b: POST /api/transcribe - Empty file (0 bytes)")
print("=" * 80)

try:
    empty_file = io.BytesIO(b'')
    files = {'file': ('test.mp3', empty_file, 'audio/mpeg')}
    response = requests.post(f"{API_BASE}/transcribe", files=files, timeout=10)
    
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "empty" in error_msg.lower()
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Empty file → 400 with 'empty' in error", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("Empty file → 400 with 'empty' in error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Empty file → 400 with 'empty' in error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 2c: POST /api/transcribe - Wrong file type (note.txt, text/plain)
# ============================================================================
print("\n" + "=" * 80)
print("TEST 2c: POST /api/transcribe - Wrong file type (note.txt, text/plain)")
print("=" * 80)

try:
    text_file = io.BytesIO(b'This is a text file, not audio')
    files = {'file': ('note.txt', text_file, 'text/plain')}
    response = requests.post(f"{API_BASE}/transcribe", files=files, timeout=10)
    
    status_ok = response.status_code == 415
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "Unsupported file type" in error_msg
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Text file → 415 with 'Unsupported file type'", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("Text file → 415 with 'Unsupported file type'", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Text file → 415 with 'Unsupported file type'", False, f"Error: {str(e)}")

# ============================================================================
# TEST 2d: POST /api/transcribe - Valid audio file (test.mp3, audio/mpeg, tiny bytes)
# This test determines the OpenAI state: no_key / key_quota_ok / key_quota_exceeded
# ============================================================================
print("\n" + "=" * 80)
print("TEST 2d: POST /api/transcribe - Valid audio (test.mp3, audio/mpeg, 1KB)")
print("=" * 80)

try:
    # Create a small fake MP3 file (just some bytes with audio mime type)
    fake_audio = io.BytesIO(b'\xff\xfb\x90\x00' + b'\x00' * 1020)  # ~1KB
    files = {'file': ('test.mp3', fake_audio, 'audio/mpeg')}
    response = requests.post(f"{API_BASE}/transcribe", files=files, timeout=30)
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
    except Exception:
        error_msg = ''
    
    # Determine OpenAI state based on response
    if response.status_code == 500 and "OPENAI_API_KEY" in error_msg and "missing" in error_msg.lower():
        openai_state = "no_key"
        expected_msg = "Server is missing the OPENAI_API_KEY environment variable. Please configure it and restart the server."
        exact_match = error_msg == expected_msg
        test_result("Valid audio → 500 with exact missing-key message", exact_match,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    elif response.status_code == 429 and "quota" in error_msg.lower():
        openai_state = "key_quota_exceeded"
        test_result("Valid audio → 429 with quota error (mapOpenAIError working!)", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    elif response.status_code == 200:
        openai_state = "key_quota_ok"
        transcript = json_data.get('transcript', '')
        # Transcript may be empty string if audio is unintelligible, which is acceptable
        test_result("Valid audio → 200 with transcript (quota available)", True,
                   f"Status: {response.status_code}, Transcript length: {len(transcript)} chars")
    elif response.status_code == 422 and "empty" in error_msg.lower():
        # Empty transcript is also acceptable for unintelligible audio
        openai_state = "key_quota_ok"
        test_result("Valid audio → 422 empty transcript (acceptable for fake audio)", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    elif response.status_code == 401 and "api key" in error_msg.lower():
        openai_state = "key_invalid"
        test_result("Valid audio → 401 with API key rejection", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("Valid audio → unexpected response", False,
                   f"Status: {response.status_code}, Response: {response.text[:300]}")
except Exception as e:
    test_result("Valid audio → unexpected response", False, f"Error: {str(e)}")

print(f"\n🔍 DETECTED OPENAI STATE: {openai_state.upper()}")
print("=" * 80)

# ============================================================================
# TEST 2e: POST /api/transcribe - REAL AUDIO FILE (sample.mp3, 52KB)
# User-requested verification with actual audio content
# ============================================================================
print("\n" + "=" * 80)
print("TEST 2e: POST /api/transcribe - REAL AUDIO FILE (/tmp/sample.mp3, 52KB)")
print("=" * 80)

real_audio_response_body = ""
try:
    # Use the real sample.mp3 file provided by user
    with open('/tmp/sample.mp3', 'rb') as f:
        files = {'file': ('sample.mp3', f, 'audio/mpeg')}
        response = requests.post(f"{API_BASE}/transcribe", files=files, timeout=120)
    
    real_audio_response_body = response.text
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        transcript = json_data.get('transcript', '')
    except Exception:
        error_msg = ''
        transcript = ''
    
    # Check for FAIL conditions first
    has_key_leak = "sk-" in response.text
    has_stack_trace = any(pattern in response.text for pattern in ["at Object.", "at Module.", "at Function.", "at async", "node_modules/", "webpack-internal:"])
    is_generic_500 = response.status_code == 500 and "OPENAI_API_KEY" not in error_msg
    
    if has_key_leak:
        test_result("REAL AUDIO → No API key leak", False,
                   f"CRITICAL: Found 'sk-' in response body!")
    elif has_stack_trace:
        test_result("REAL AUDIO → No stack trace", False,
                   f"CRITICAL: Found Node.js stack trace in response!")
    elif is_generic_500:
        test_result("REAL AUDIO → No generic 500 error (mapOpenAIError regression)", False,
                   f"CRITICAL: Got generic 500 error. Status: {response.status_code}, Error: '{error_msg}'")
    # Check for acceptable outcomes
    elif response.status_code == 200 and transcript:
        test_result("REAL AUDIO → 200 with transcript (quota available)", True,
                   f"Status: {response.status_code}, Transcript: '{transcript[:100]}...' ({len(transcript)} chars)")
    elif response.status_code == 422 and "empty" in error_msg.lower():
        test_result("REAL AUDIO → 422 empty transcription (silent audio)", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    elif response.status_code == 429 and "quota" in error_msg.lower():
        test_result("REAL AUDIO → 429 quota exhausted (expected state)", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    elif response.status_code == 401 and "api key" in error_msg.lower():
        test_result("REAL AUDIO → 401 API key rejected", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("REAL AUDIO → unexpected response", False,
                   f"Status: {response.status_code}, Response: {response.text[:300]}")
    
    print(f"   📄 FULL RESPONSE BODY: {real_audio_response_body}")
    
except FileNotFoundError:
    test_result("REAL AUDIO → file exists", False, "File /tmp/sample.mp3 not found")
except Exception as e:
    test_result("REAL AUDIO → unexpected error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 3a: POST /api/summarize - Non-JSON body
# ============================================================================
print("\n" + "=" * 80)
print("TEST 3a: POST /api/summarize - Non-JSON body")
print("=" * 80)

try:
    response = requests.post(f"{API_BASE}/summarize", 
                            data="not json", 
                            headers={'Content-Type': 'application/json'},
                            timeout=10)
    
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = error_msg == "Invalid JSON body."
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Non-JSON → 400 'Invalid JSON body.'", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("Non-JSON → 400 'Invalid JSON body.'", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Non-JSON → 400 'Invalid JSON body.'", False, f"Error: {str(e)}")

# ============================================================================
# TEST 3b: POST /api/summarize - Empty object {}
# ============================================================================
print("\n" + "=" * 80)
print("TEST 3b: POST /api/summarize - Empty object {}")
print("=" * 80)

try:
    response = requests.post(f"{API_BASE}/summarize", 
                            json={},
                            timeout=10)
    
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = error_msg == "Transcript is required."
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Empty object → 400 'Transcript is required.'", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("Empty object → 400 'Transcript is required.'", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Empty object → 400 'Transcript is required.'", False, f"Error: {str(e)}")

# ============================================================================
# TEST 3c: POST /api/summarize - Whitespace transcript "   "
# ============================================================================
print("\n" + "=" * 80)
print("TEST 3c: POST /api/summarize - Whitespace transcript '   '")
print("=" * 80)

try:
    response = requests.post(f"{API_BASE}/summarize", 
                            json={"transcript": "   "},
                            timeout=10)
    
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = error_msg == "Transcript is required."
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Whitespace transcript → 400 'Transcript is required.'", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("Whitespace transcript → 400 'Transcript is required.'", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Whitespace transcript → 400 'Transcript is required.'", False, f"Error: {str(e)}")

# ============================================================================
# TEST 3d: POST /api/summarize - Valid transcript
# Response depends on OpenAI state detected earlier
# ============================================================================
print("\n" + "=" * 80)
print("TEST 3d: POST /api/summarize - Valid transcript")
print("=" * 80)

try:
    test_transcript = "Alice will send the report on Friday. Bob will review it."
    response = requests.post(f"{API_BASE}/summarize", 
                            json={"transcript": test_transcript},
                            timeout=30)
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
    except Exception:
        error_msg = ''
    
    if openai_state == "no_key":
        # Expect 500 with missing key message
        status_ok = response.status_code == 500
        expected_msg = "Server is missing the OPENAI_API_KEY environment variable. Please configure it and restart the server."
        exact_match = error_msg == expected_msg
        test_result("Valid transcript → 500 with exact missing-key message", exact_match,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    elif openai_state == "key_quota_exceeded":
        # Expect 429 with quota message
        status_ok = response.status_code == 429
        quota_ok = "quota" in error_msg.lower()
        test_result("Valid transcript → 429 with quota error (mapOpenAIError working!)", status_ok and quota_ok,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    elif openai_state == "key_quota_ok":
        # Expect 200 with structured response
        status_ok = response.status_code == 200
        if status_ok:
            has_summary = 'summary' in json_data
            has_key_topics = 'key_topics' in json_data
            has_key_decisions = 'key_decisions' in json_data
            has_action_items = 'action_items' in json_data
            has_important_notes = 'important_notes' in json_data
            
            all_keys_present = has_summary and has_key_topics and has_key_decisions and has_action_items and has_important_notes
            
            # Check action_items structure
            action_items_ok = True
            if has_action_items and isinstance(json_data['action_items'], list):
                for item in json_data['action_items']:
                    if not all(k in item for k in ['task', 'owner', 'deadline']):
                        action_items_ok = False
                        break
            
            if all_keys_present and action_items_ok:
                test_result("Valid transcript → 200 with all required keys and action_items structure", True,
                           f"Status: {response.status_code}, Keys: summary, key_topics, key_decisions, action_items (with task/owner/deadline), important_notes")
            else:
                test_result("Valid transcript → 200 with all required keys and action_items structure", False,
                           f"Status: {response.status_code}, Missing keys or invalid structure. Response: {str(json_data)[:300]}")
        else:
            test_result("Valid transcript → 200 with structured response", False,
                       f"Status: {response.status_code}, Response: {response.text[:300]}")
    else:
        test_result("Valid transcript → response depends on OpenAI state", False,
                   f"Unknown OpenAI state, cannot verify. Status: {response.status_code}")
except Exception as e:
    test_result("Valid transcript → response depends on OpenAI state", False, f"Error: {str(e)}")

# ============================================================================
# TEST 3e: POST /api/summarize - REAL TRANSCRIPT
# User-requested verification with actual meeting transcript content
# ============================================================================
print("\n" + "=" * 80)
print("TEST 3e: POST /api/summarize - REAL TRANSCRIPT")
print("=" * 80)

real_summarize_response_body = ""
try:
    real_transcript = "Alice will send the Q3 report by Friday. Bob agreed to review it. We decided to move the beta launch to Aug 15."
    response = requests.post(f"{API_BASE}/summarize", 
                            json={"transcript": real_transcript},
                            timeout=120)
    
    real_summarize_response_body = response.text
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
    except Exception:
        error_msg = ''
    
    # Check for FAIL conditions first
    has_key_leak = "sk-" in response.text
    has_stack_trace = any(pattern in response.text for pattern in ["at Object.", "at Module.", "at Function.", "at async", "node_modules/", "webpack-internal:"])
    is_generic_500 = response.status_code == 500 and "OPENAI_API_KEY" not in error_msg
    
    if has_key_leak:
        test_result("REAL TRANSCRIPT → No API key leak", False,
                   f"CRITICAL: Found 'sk-' in response body!")
    elif has_stack_trace:
        test_result("REAL TRANSCRIPT → No stack trace", False,
                   f"CRITICAL: Found Node.js stack trace in response!")
    elif is_generic_500:
        test_result("REAL TRANSCRIPT → No generic 500 error (mapOpenAIError regression)", False,
                   f"CRITICAL: Got generic 500 error. Status: {response.status_code}, Error: '{error_msg}'")
    # Check for acceptable outcomes
    elif response.status_code == 200:
        has_summary = 'summary' in json_data
        has_key_topics = 'key_topics' in json_data
        has_key_decisions = 'key_decisions' in json_data
        has_action_items = 'action_items' in json_data
        has_important_notes = 'important_notes' in json_data
        
        all_keys_present = has_summary and has_key_topics and has_key_decisions and has_action_items and has_important_notes
        
        # Check action_items structure
        action_items_ok = True
        if has_action_items and isinstance(json_data['action_items'], list):
            for item in json_data['action_items']:
                if not all(k in item for k in ['task', 'owner', 'deadline']):
                    action_items_ok = False
                    break
        
        if all_keys_present and action_items_ok:
            test_result("REAL TRANSCRIPT → 200 with structured output (quota available)", True,
                       f"Status: {response.status_code}, Keys: summary, key_topics, key_decisions, action_items[task/owner/deadline], important_notes")
        else:
            test_result("REAL TRANSCRIPT → 200 with structured output", False,
                       f"Status: {response.status_code}, Missing keys or invalid structure")
    elif response.status_code == 429 and "quota" in error_msg.lower():
        test_result("REAL TRANSCRIPT → 429 quota exhausted (expected state)", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    elif response.status_code == 401 and "api key" in error_msg.lower():
        test_result("REAL TRANSCRIPT → 401 API key rejected", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("REAL TRANSCRIPT → unexpected response", False,
                   f"Status: {response.status_code}, Response: {response.text[:300]}")
    
    print(f"   📄 FULL RESPONSE BODY: {real_summarize_response_body}")
    
except Exception as e:
    test_result("REAL TRANSCRIPT → unexpected error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 3f: POST /api/summarize - Too long transcript (>120k chars)
# ============================================================================
print("\n" + "=" * 80)
print("TEST 3f: POST /api/summarize - Too long transcript (121k chars)")
print("=" * 80)

try:
    long_transcript = "x" * 121000  # 121k characters
    response = requests.post(f"{API_BASE}/summarize", 
                            json={"transcript": long_transcript},
                            timeout=10)
    
    status_ok = response.status_code == 413
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "too long" in error_msg.lower()
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Too long transcript → 413 with 'too long' in error", True,
                   f"Status: {response.status_code}, Error: '{error_msg}'")
    else:
        test_result("Too long transcript → 413 with 'too long' in error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Too long transcript → 413 with 'too long' in error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 4: Security - No "sk-" in any response
# ============================================================================
print("\n" + "=" * 80)
print("TEST 4: Security - No 'sk-' in any response")
print("=" * 80)

# Collect all responses
all_responses = []

try:
    # Test transcribe endpoint
    fake_audio = io.BytesIO(b'\xff\xfb\x90\x00' + b'\x00' * 100)
    files = {'file': ('test.mp3', fake_audio, 'audio/mpeg')}
    r1 = requests.post(f"{API_BASE}/transcribe", files=files, timeout=10)
    all_responses.append(r1.text)
    
    # Test summarize endpoint
    r2 = requests.post(f"{API_BASE}/summarize", 
                      json={"transcript": "test"},
                      timeout=10)
    all_responses.append(r2.text)
    
    # Check for "sk-" pattern (OpenAI key prefix)
    has_key_leak = any("sk-" in resp for resp in all_responses)
    
    if not has_key_leak:
        test_result("No 'sk-' pattern found in any response", True,
                   "Checked all error responses")
    else:
        test_result("No 'sk-' pattern found in any response", False,
                   "Found 'sk-' pattern in response - API KEY LEAK!")
except Exception as e:
    test_result("No 'sk-' pattern found in any response", False, f"Error: {str(e)}")

# ============================================================================
# TEST 4: Security - No Node stack traces
# ============================================================================
print("\n" + "=" * 80)
print("TEST 4: Security - No Node stack traces ('at ' lines, filepaths)")
print("=" * 80)

try:
    # Check for common stack trace patterns
    stack_patterns = [
        "at Object.",
        "at Module.",
        "at Function.",
        "at async",
        "node_modules/",
        "webpack-internal:",
    ]
    
    has_stack_trace = False
    for resp in all_responses:
        for pattern in stack_patterns:
            if pattern in resp:
                has_stack_trace = True
                break
        if has_stack_trace:
            break
    
    if not has_stack_trace:
        test_result("No Node stack traces in any response", True,
                   "Checked all error responses for stack trace patterns")
    else:
        test_result("No Node stack traces in any response", False,
                   "Found stack trace patterns in response")
except Exception as e:
    test_result("No Node stack traces in any response", False, f"Error: {str(e)}")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("FINAL TEST SUMMARY")
print("=" * 80)
print(f"OpenAI State Detected: {openai_state.upper()}")
print(f"  - no_key: Server missing OPENAI_API_KEY")
print(f"  - key_quota_ok: Key configured and quota available")
print(f"  - key_quota_exceeded: Key configured but quota exceeded (429 errors)")
print("=" * 80)
print(f"Total Tests: {total_tests}")
print(f"Passed: {passed_tests} ✅")
print(f"Failed: {failed_tests} ❌")
print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
print("=" * 80)

if failed_tests == 0:
    print("\n🎉 ALL TESTS PASSED!")
    if openai_state == "key_quota_exceeded":
        print("⚠️  Note: OpenAI quota is exceeded, but the 429 errors are being correctly surfaced (mapOpenAIError fix verified).")
    elif openai_state == "key_quota_ok":
        print("✅ OpenAI integration is fully functional with available quota.")
    elif openai_state == "no_key":
        print("⚠️  Note: OPENAI_API_KEY is not configured, but all validation paths work correctly.")
    exit(0)
else:
    print(f"\n⚠️  {failed_tests} test(s) failed. Please review the failures above.")
    exit(1)
