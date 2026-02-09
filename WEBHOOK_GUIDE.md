# ANPR Camera Webhook Integration Guide

## Overview
The system supports two webhook endpoints for ANPR camera integration:
- **Camera 1**: `POST /webhook`
- **Camera 2**: `POST /webhooks`

## Base URL
```
http://your-server-ip:5000
```

## Webhook Endpoints

### Camera 1 - `/webhook`
```bash
POST http://localhost:5000/webhook
```

### Camera 2 - `/webhooks`
```bash
POST http://localhost:5000/webhooks
```

---

## Payload Format

### Required Fields
The system supports multiple payload formats. At minimum, you need:
- **Plate Number**: `plateNumber`, `plate`, or `Picture.Plate.PlateNumber`
- **Images** (optional): Base64-encoded image data

### Supported Plate Fields
```json
{
  "plateNumber": "MH01AB1234"   // Main format
}
```

OR

```json
{
  "plate": "MH01AB1234"         // Alternative format
}
```

OR

```json
{
  "Picture": {
    "Plate": {
      "PlateNumber": "MH01AB1234"   // Nested format (some ANPR systems)
    }
  }
}
```

### Images Field
```json
{
  "images": {
    "plate": "base64_encoded_string",      // License plate crop
    "full": "base64_encoded_string",       // Full frame image
    "context": "base64_encoded_string"     // Additional context image (optional)
  }
}
```

---

## Example Payloads

### ✅ Minimal Payload (Plate Only)
```json
{
  "plateNumber": "MH01AB1234"
}
```

### ✅ With Images
```json
{
  "plateNumber": "MH01AB1234",
  "images": {
    "plate": "iVBORw0KGgoAAAANSUhEUg...",
    "full": "iVBORw0KGgoAAAANSUhEUg..."
  }
}
```

### ✅ Full Format (Recommended)
```json
{
  "plateNumber": "MH01AB1234",
  "camera": "camera1",
  "timestamp": "2026-02-09T12:30:00Z",
  "images": {
    "plate": "iVBORw0KGgoAAAANSUhEUg...",
    "full": "iVBORw0KGgoAAAANSUhEUg...",
    "context": "iVBORw0KGgoAAAANSUhEUg..."
  }
}
```

### ✅ Alternative Format (Some ANPR Systems)
```json
{
  "Picture": {
    "Plate": {
      "PlateNumber": "MH01AB1234"
    }
  },
  "images": {
    "plate": "iVBORw0KGgoAAAANSUhEUg...",
    "full": "iVBORw0KGgoAAAANSUhEUg..."
  }
}
```

---

## Response Format

### Success Response
```json
{
  "ok": true,
  "detectionId": 21,
  "imageCount": 2,
  "message": "Detection saved successfully"
}
```

### Error Response
```json
{
  "error": "Error message describing the issue"
}
```

---

## cURL Examples

### Camera 1 - Basic Plate Detection
```bash
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "MH01AB1234"
  }'
```

### Camera 2 - With Images
```bash
curl -X POST http://localhost:5000/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "plate": "MH01AB5678",
    "images": {
      "plate": "iVBORw0KGgoAAAANSUhEUg...",
      "full": "iVBORw0KGgoAAAANSUhEUg..."
    }
  }'
```

---

## PowerShell Examples

### Test Camera 1
```powershell
$body = @{
    plateNumber = "MH01AB9999"
    images = @{
        plate = "iVBORw0KGgoAAAANSUhEUg..."
        full = "iVBORw0KGgoAAAANSUhEUg..."
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/webhook" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### Test Camera 2
```powershell
$body = @{
    plate = "MH01AB8888"
    images = @{
        plate = "iVBORw0KGgoAAAANSUhEUg..."
        full = "iVBORw0KGgoAAAANSUhEUg..."
        context = "iVBORw0KGgoAAAANSUhEUg..."
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/webhooks" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

---

## Image Handling

### Image Storage
- **Location**: `uploads/{camera}/{date}/{plate}/`
- **Example**: `uploads/camera1/2026-02-09/MH01AB1234/`

### Image Types
- `plate` - License plate crop image
- `full` - Full vehicle frame
- `context` - Additional context (optional)

### Image Retrieval
Images are returned in the API response:
```json
{
  "images": {
    "plate": "/uploads/camera1/2026-02-09/MH01AB1234/plate.jpg",
    "full": "/uploads/camera1/2026-02-09/MH01AB1234/full.jpg"
  }
}
```

---

## Database Records Created

Each webhook creates the following:

### 1. Vehicle Record
- Plate number stored/updated
- Linked to detections

### 2. Detection Record
- Camera name (auto-detected from URL)
- Camera IP (from request headers)
- Plate number
- Timestamp

### 3. Image Records (if provided)
- Image type (plate, full, context)
- File path
- Storage location

---

## Testing Endpoints

### Fetch All Detections
```bash
curl http://localhost:5000/api/detections?page=1&limit=20
```

### Search by Plate
```bash
curl http://localhost:5000/api/detections/search?q=MH01AB1234
```

### Filter by Camera
```bash
curl http://localhost:5000/api/detections?camera=camera1&page=1&limit=20
```

### Fetch Cameras
```bash
curl http://localhost:5000/api/cameras
```

---

## Frontend Auto-Updates

The frontend automatically:
- ✅ Checks for new detections every 2-3 seconds
- ✅ Displays latest detections at the top
- ✅ Shows vehicle images automatically
- ✅ Updates total count in real-time

No manual refresh needed!

---

## Troubleshooting

### Webhook Not Received
1. Verify server is running: `http://localhost:5000/api/cameras`
2. Check firewall allows port 5000
3. Verify correct endpoint URL (webhook vs webhooks)
4. Check server logs for errors

### Images Not Showing
1. Ensure images are valid base64 strings
2. Check browser console for errors
3. Verify `uploads/` directory exists
4. Check file permissions

### Detections Not Updating in UI
1. Check browser console for API errors
2. Verify backend is accessible
3. Clear browser cache
4. Check auto-refresh is enabled (2-3 second interval)

---

## API Statistics

### Pagination
```bash
/api/detections?page=1&limit=50
```

### Filters
```bash
/api/detections?camera=camera1&plate=MH01&page=1&limit=50
```

### Date Range
```bash
/api/detections?startDate=2026-02-01&endDate=2026-02-28&page=1&limit=50
```

---

## Recent Test Results

✅ **Camera 1 Webhook Test**
- Detection ID: 21
- Plate: MH01AB9999
- Images: 2 (plate, full)
- Status: SUCCESS

✅ **Camera 2 Webhook Test**
- Detection ID: 22
- Plate: MH01AB8888
- Images: 3 (plate, full, context)
- Status: SUCCESS

✅ **Total Detections**: 22
✅ **Frontend Auto-Refresh**: Every 2-3 seconds
✅ **Image Storage**: Working correctly

---

## Support

For issues or questions, check:
1. Server logs: `npm start` output
2. Browser console: Developer tools
3. Network tab: API requests/responses
