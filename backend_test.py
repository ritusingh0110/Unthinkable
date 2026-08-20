#!/usr/bin/env python3
"""
Backend API Test Suite for AI Meeting Summarizer
Tests all validation paths and error handling without requiring OPENAI_API_KEY
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
        test_result("Homepage returns 200 with correct content", True, 
                   f"Status: {response.status_code}, Content contains 'AI Meeting Summarizer'")
    else:
        test_result("Homepage returns 200 with correct content", False,
                   f"Status: {response.status_code}, Content check: {content_ok}")
except Exception as e:
    test_result("Homepage returns 200 with correct content", False, f"Error: {str(e)}")

# ============================================================================
# TEST 2: POST /api/transcribe - No body / no file
# ============================================================================
print("\n" + "=" * 80)
print("TEST 2: POST /api/transcribe - No body / no file")
print("=" * 80)

try:
    # Test with no body at all
    response = requests.post(f"{API_BASE}/transcribe", timeout=10)
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        # Accept either error message
        error_ok = "No audio file provided" in error_msg or "Invalid form data" in error_msg
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("No body returns 400 with error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
    else:
        test_result("No body returns 400 with error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("No body returns 400 with error", False, f"Error: {str(e)}")

# Test with empty multipart (no file field)
try:
    response = requests.post(f"{API_BASE}/transcribe", files={}, timeout=10)
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "No audio file provided" in error_msg or "Invalid form data" in error_msg
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Empty multipart returns 400 with error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
    else:
        test_result("Empty multipart returns 400 with error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Empty multipart returns 400 with error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 3: POST /api/transcribe - Empty file (0 bytes)
# ============================================================================
print("\n" + "=" * 80)
print("TEST 3: POST /api/transcribe - Empty file (0 bytes)")
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
        test_result("Empty file returns 400 with error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
    else:
        test_result("Empty file returns 400 with error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Empty file returns 400 with error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 4: POST /api/transcribe - Wrong file type (text file)
# ============================================================================
print("\n" + "=" * 80)
print("TEST 4: POST /api/transcribe - Wrong file type (text file)")
print("=" * 80)

try:
    text_file = io.BytesIO(b'This is a text file, not audio')
    files = {'file': ('note.txt', text_file, 'text/plain')}
    response = requests.post(f"{API_BASE}/transcribe", files=files, timeout=10)
    
    status_ok = response.status_code == 415
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "Unsupported file type" in error_msg or "unsupported" in error_msg.lower()
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Text file returns 415 with error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
    else:
        test_result("Text file returns 415 with error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Text file returns 415 with error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 5: POST /api/transcribe - Valid audio file (should fail with missing key)
# ============================================================================
print("\n" + "=" * 80)
print("TEST 5: POST /api/transcribe - Valid audio file (missing API key)")
print("=" * 80)

try:
    # Create a small fake MP3 file (just some bytes with audio mime type)
    fake_audio = io.BytesIO(b'\xff\xfb\x90\x00' + b'\x00' * 100)  # MP3 header-like bytes
    files = {'file': ('test.mp3', fake_audio, 'audio/mpeg')}
    response = requests.post(f"{API_BASE}/transcribe", files=files, timeout=10)
    
    status_ok = response.status_code == 500
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "OPENAI_API_KEY" in error_msg and "missing" in error_msg.lower()
        expected_msg = "Server is missing the OPENAI_API_KEY environment variable. Please configure it and restart the server."
        exact_match = error_msg == expected_msg
    except Exception:
        error_ok = False
        exact_match = False
    
    if status_ok and error_ok:
        test_result("Valid audio returns 500 with missing key error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
        if exact_match:
            print("   ✓ Exact error message match")
        else:
            print("   ⚠ Error message contains key info but not exact match")
    else:
        test_result("Valid audio returns 500 with missing key error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Valid audio returns 500 with missing key error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 6: POST /api/summarize - Non-JSON body
# ============================================================================
print("\n" + "=" * 80)
print("TEST 6: POST /api/summarize - Non-JSON body")
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
        error_ok = "Invalid JSON" in error_msg or "json" in error_msg.lower()
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Non-JSON body returns 400 with error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
    else:
        test_result("Non-JSON body returns 400 with error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Non-JSON body returns 400 with error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 7: POST /api/summarize - Empty object
# ============================================================================
print("\n" + "=" * 80)
print("TEST 7: POST /api/summarize - Empty object")
print("=" * 80)

try:
    response = requests.post(f"{API_BASE}/summarize", 
                            json={},
                            timeout=10)
    
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "Transcript is required" in error_msg or "required" in error_msg.lower()
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Empty object returns 400 with error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
    else:
        test_result("Empty object returns 400 with error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Empty object returns 400 with error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 8: POST /api/summarize - Whitespace transcript
# ============================================================================
print("\n" + "=" * 80)
print("TEST 8: POST /api/summarize - Whitespace transcript")
print("=" * 80)

try:
    response = requests.post(f"{API_BASE}/summarize", 
                            json={"transcript": "   "},
                            timeout=10)
    
    status_ok = response.status_code == 400
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "Transcript is required" in error_msg or "required" in error_msg.lower()
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Whitespace transcript returns 400 with error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
    else:
        test_result("Whitespace transcript returns 400 with error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Whitespace transcript returns 400 with error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 9: POST /api/summarize - Valid transcript (missing API key)
# ============================================================================
print("\n" + "=" * 80)
print("TEST 9: POST /api/summarize - Valid transcript (missing API key)")
print("=" * 80)

try:
    response = requests.post(f"{API_BASE}/summarize", 
                            json={"transcript": "This is a test meeting transcript about project planning."},
                            timeout=10)
    
    status_ok = response.status_code == 500
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "OPENAI_API_KEY" in error_msg and "missing" in error_msg.lower()
        expected_msg = "Server is missing the OPENAI_API_KEY environment variable. Please configure it and restart the server."
        exact_match = error_msg == expected_msg
    except Exception:
        error_ok = False
        exact_match = False
    
    if status_ok and error_ok:
        test_result("Valid transcript returns 500 with missing key error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
        if exact_match:
            print("   ✓ Exact error message match")
        else:
            print("   ⚠ Error message contains key info but not exact match")
    else:
        test_result("Valid transcript returns 500 with missing key error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Valid transcript returns 500 with missing key error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 10: POST /api/summarize - Too long transcript (>120k chars)
# ============================================================================
print("\n" + "=" * 80)
print("TEST 10: POST /api/summarize - Too long transcript (>120k chars)")
print("=" * 80)

try:
    long_transcript = "A" * 121000  # 121k characters
    response = requests.post(f"{API_BASE}/summarize", 
                            json={"transcript": long_transcript},
                            timeout=10)
    
    status_ok = response.status_code == 413
    
    try:
        json_data = response.json()
        error_msg = json_data.get('error', '')
        error_ok = "too long" in error_msg.lower() or "413" in str(response.status_code)
    except Exception:
        error_ok = False
    
    if status_ok and error_ok:
        test_result("Too long transcript returns 413 with error", True,
                   f"Status: {response.status_code}, Error: {error_msg}")
    else:
        test_result("Too long transcript returns 413 with error", False,
                   f"Status: {response.status_code}, Response: {response.text[:200]}")
except Exception as e:
    test_result("Too long transcript returns 413 with error", False, f"Error: {str(e)}")

# ============================================================================
# TEST 11: Security - No API key leakage
# ============================================================================
print("\n" + "=" * 80)
print("TEST 11: Security - No API key leakage")
print("=" * 80)

# Collect all responses from previous tests
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
        test_result("No API key leakage (no 'sk-' in responses)", True,
                   "Checked all error responses")
    else:
        test_result("No API key leakage (no 'sk-' in responses)", False,
                   "Found 'sk-' pattern in response")
except Exception as e:
    test_result("No API key leakage (no 'sk-' in responses)", False, f"Error: {str(e)}")

# ============================================================================
# TEST 12: Security - No stack traces
# ============================================================================
print("\n" + "=" * 80)
print("TEST 12: Security - No raw stack traces")
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
        "Error: Error:",  # Doubled error prefix
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
        test_result("No raw stack traces in error responses", True,
                   "Checked all error responses for stack trace patterns")
    else:
        test_result("No raw stack traces in error responses", False,
                   "Found stack trace patterns in response")
except Exception as e:
    test_result("No raw stack traces in error responses", False, f"Error: {str(e)}")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"Total Tests: {total_tests}")
print(f"Passed: {passed_tests} ✅")
print(f"Failed: {failed_tests} ❌")
print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
print("=" * 80)

if failed_tests == 0:
    print("\n🎉 ALL TESTS PASSED! Backend is ready for deployment.")
    exit(0)
else:
    print(f"\n⚠️  {failed_tests} test(s) failed. Please review the failures above.")
    exit(1)
