# ANPR CAMERA NOT SENDING DATA - TROUBLESHOOTING GUIDE

## 🔴 PROBLEM
Vehicles are passing in front of your ANPR camera, but the dashboard is not updating and images are not showing.

## ✅ SOLUTION STEPS

### STEP 1: CONFIGURE YOUR ANPR CAMERA

Your camera must be configured to send HTTP webhooks to your server.

**Server Details:**
- **Server IP**: `192.168.1.120`
- **Webhook URL for Camera 1**: `http://192.168.1.120:5000/webhook`
- **Webhook URL for Camera 2**: `http://192.168.1.120:5000/webhooks`

**Camera Configuration:**
1. Log into your ANPR camera's web interface (usually http://camera-ip)
2. Find webhook/notification settings (location varies by brand):
   - **Hikvision**: Configuration > Event > Smart Event > HTTP Listening
   - **Dahua**: Setup > Event > IVS > HTTP Callback
   - **Generic**: Settings > Events > HTTP Notification
3. Enter webhook URL: `http://192.168.1.120:5000/webhook`
4. Method: **POST**
5. Content-Type: **application/json**
6. Enable/Active: **Yes**
7. Save and test

---

### STEP 2: OPEN FIREWALL PORTS

Your Windows Firewall may be blocking incoming connections.

**Option A - Automatic (Recommended):**
```cmd
Right-click: configure_firewall.bat
Select: "Run as Administrator"
```

**Option B - Manual:**
```cmd
netsh advfirewall firewall add rule name="ANPR Backend API" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="ANPR Frontend" dir=in action=allow protocol=TCP localport=3000
```

---

### STEP 3: MONITOR INCOMING REQUESTS

Open the webhook monitor to see if data is arriving:

**Webhook Monitor**: http://192.168.1.120:5000/webhook-monitor.html

This page will show:
- ✅ Total requests received
- ✅ Latest license plates detected
- ✅ Real-time log of all detections

**What to check:**
- If you see "Waiting for webhook requests..." → Camera is NOT sending data
- If you see detections appearing → Camera IS working ✅

---

### STEP 4: TEST THE SYSTEM

**Test 1 - Send Test Detection:**
```bash
python send_test_detection.py
```
- This should immediately appear in dashboard
- If this works, your system is fine - camera needs configuration

**Test 2 - Test from Another Computer:**
```bash
curl -X POST http://192.168.1.120:5000/webhook \
  -H "Content-Type: application/json" \
  -d '{"plateNumber":"TEST123"}'
```

---

### STEP 5: CHECK BACKEND LOGS

Watch the backend console for incoming requests. You should see:

```
======================================================================
📸 WEBHOOK RECEIVED - 2026-02-09T18:30:00.000Z
======================================================================
URL: /webhook
METHOD: POST
HEADERS: {...}
BODY: {"plateNumber":"MH12AB1234",...}
IP ADDRESS: 192.168.1.xxx
======================================================================
```

**If you DON'T see this:**
- Camera is not sending data
- Wrong URL configured
- Firewall blocking
- Network issue

**If you DO see this:**
- System is working!
- Check plate number format
- Check if images are in payload

---

## 🔍 COMMON ISSUES

### Issue 1: Images Not Showing

**Cause**: Camera is not sending base64-encoded images in the payload

**Solution**: 
- Check if your camera supports sending images via webhook
- Some cameras only send plate text, not images
- May need to enable "Include Image" option
- Image format must be: `{"images": {"plate": "base64...", "full": "base64..."}}`

### Issue 2: No Data Arriving

**Causes**:
1. Camera webhook URL is wrong
2. Camera not configured to send on every detection
3. Firewall blocking port 5000
4. Camera and server on different networks

**Solutions**:
1. Double-check URL: `http://192.168.1.120:5000/webhook`
2. Enable "Send on every detection" in camera
3. Run `configure_firewall.bat` as Administrator
4. Verify camera can ping server: `ping 192.168.1.120`

### Issue 3: Wrong Data Format

**Cause**: Camera sends data in different format

**What we support**:
```json
{
  "plateNumber": "MH12AB1234"     // Option 1
}

{
  "plate": "MH12AB1234"           // Option 2
}

{
  "Picture": {
    "Plate": {
      "PlateNumber": "MH12AB1234"  // Option 3 (nested)
    }
  }
}
```

**Solution**: Check backend logs to see incoming format, we may need to add support

---

## 📊 VERIFY SYSTEM IS WORKING

### Dashboard
http://192.168.1.120:3000
- Should auto-refresh every 2 seconds
- Shows latest 20 detections with images

### API Endpoint
http://192.168.1.120:5000/api/detections
- Shows raw JSON data
- Should have your detections

### Debug Console
http://192.168.1.120:5000/debug.html
- Real-time system status
- Last 10 detections

### Webhook Monitor
http://192.168.1.120:5000/webhook-monitor.html
- Real-time incoming webhook log
- Perfect for troubleshooting

---

## 🆘 STILL NOT WORKING?

1. **Run system check**:
   ```bash
   python system_status_check.py
   ```

2. **Check camera logs** (in camera web interface):
   - Look for HTTP errors
   - Check connection failures
   - Verify webhook is enabled

3. **Test from camera network**:
   - Use another computer on same network as camera
   - Run: `curl http://192.168.1.120:5000/webhook -X POST -d '{"plateNumber":"TEST"}'`

4. **Contact camera manufacturer**:
   - Ask about webhook/HTTP notification format
   - Request documentation for webhook payload structure
   - Verify camera firmware supports webhooks

---

## 📞 NEXT STEPS

1. ✅ Configure camera webhook URL
2. ✅ Run firewall configuration
3. ✅ Open webhook monitor
4. ✅ Wait for vehicle to pass camera
5. ✅ Check if detection appears

The system is ready and working - it just needs your camera to send the data!
