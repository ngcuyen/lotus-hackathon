# Sketch2App Backend Deployment Guide

## ✅ Build Status

**SAM Build Successful!**

```
✅ Template validated
✅ Build completed
✅ 8 Lambda functions ready
```

## 📦 Built Functions

1. **GenerateFunction** - Generate React code from sketch
2. **GenerateStreamFunction** - Stream generation response
3. **SaveStyleFunction** - Save custom styles
4. **ListStylesFunction** - List custom styles
5. **DeleteStyleFunction** - Delete custom styles
6. **SavePanelSettingsFunction** - Save panel settings
7. **GetPanelSettingsFunction** - Get panel settings
8. **ResetPanelSettingsFunction** - Reset panel settings

## 🚀 Deployment Options

### Option 1: Deploy to AWS (Production)

```bash
cd backend
sam deploy --guided
```

**What it will ask:**
1. Stack Name: `sketch2app-backend` (default)
2. AWS Region: `us-east-1` (default)
3. Confirm changes before deploy: `Y`
4. Allow SAM CLI IAM role creation: `Y`
5. Save arguments to config: `Y`

**Subsequent deploys:**
```bash
sam deploy
```

### Option 2: Local Testing

```bash
# Start local API
sam local start-api --port 4000

# Test specific function
sam local invoke GenerateFunction --event events/test-event.json
```

### Option 3: Quick Sync (Dev)

```bash
# Fast incremental deployment with hot reload
sam sync --stack-name sketch2app-backend --watch
```

## 🔑 Prerequisites for AWS Deployment

### 1. AWS CLI configured

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

### 2. AWS Bedrock Access

Ensure your AWS account has:
- Access to Claude Sonnet 4 model in us-east-1
- Bedrock service enabled
- Proper IAM permissions

### 3. Check AWS credentials

```bash
aws sts get-caller-identity
```

## 📊 Deployment Architecture

```
AWS Resources Created:
├── API Gateway (REST API)
├── 8 Lambda Functions
├── S3 Bucket (sketch2app-images-{account-id})
├── CloudWatch Logs
└── IAM Roles & Policies
```

## 🌐 API Endpoints (After Deploy)

```
Base URL: https://{api-id}.execute-api.us-east-1.amazonaws.com/prod

POST   /api/generate              # Generate from sketch
POST   /api/generate-stream       # Stream generation
GET    /api/styles                # List custom styles
POST   /api/styles                # Save custom style
DELETE /api/styles/{styleId}      # Delete custom style
GET    /api/settings/panel        # Get panel settings
POST   /api/settings/panel        # Save panel settings
POST   /api/settings/panel/reset  # Reset panel settings
```

## 🔧 Environment Variables

Set in `template.yaml`:

```yaml
Environment:
  Variables:
    S3_BUCKET: !Ref ImageBucket
    MODEL_ID: us.anthropic.claude-sonnet-4-20250514-v1:0
```

## 💰 Cost Estimation

**AWS Resources:**
- API Gateway: ~$3.50/million requests
- Lambda: First 1M requests/month free
- S3: First 50GB storage free
- Bedrock Claude: Pay per token (~$3/1M input tokens)

**Expected monthly cost (low traffic):** $10-50

## 🧪 Testing Deployment

### Test Generate endpoint

```bash
API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"

curl -X POST $API_URL/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "data:image/png;base64,...",
    "style": "modern"
  }'
```

### Test Styles endpoint

```bash
# Save style
curl -X POST $API_URL/api/styles \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "style": {
      "id": "custom-123",
      "name": "Test Style",
      "description": "Test",
      "data": {"colorPrimary": "#FF0000"}
    }
  }'

# List styles
curl $API_URL/api/styles?userId=test-user

# Delete style
curl -X DELETE $API_URL/api/styles/custom-123?userId=test-user
```

### Test Settings endpoint

```bash
# Save settings
curl -X POST $API_URL/api/settings/panel \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "settings": {
      "panelOpacity": 80,
      "colorScheme": "purple"
    }
  }'

# Get settings
curl $API_URL/api/settings/panel?userId=test-user
```

## 📝 Update Frontend Config

After deployment, update frontend `.env`:

```bash
# frontend/.env
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

## 🔍 Monitoring

### View logs

```bash
sam logs -n GenerateFunction --stack-name sketch2app-backend --tail

# Or in AWS Console
# CloudWatch > Log groups > /aws/lambda/sketch2app-backend-GenerateFunction
```

### Check metrics

```bash
# API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=sketch2app-backend \
  --start-time 2025-01-20T00:00:00Z \
  --end-time 2025-01-21T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## 🗑️ Cleanup (Delete Stack)

```bash
sam delete --stack-name sketch2app-backend

# This will delete:
# - All Lambda functions
# - API Gateway
# - S3 bucket (if empty)
# - CloudWatch logs
# - IAM roles
```

## 🐛 Troubleshooting

### Deployment fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Validate template
sam validate --lint

# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name sketch2app-backend \
  --max-items 10
```

### Function errors

```bash
# View function logs
sam logs -n GenerateFunction --stack-name sketch2app-backend --tail

# Test function locally
sam local invoke GenerateFunction -e events/test.json
```

### Bedrock access denied

```bash
# Check Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Request model access in AWS Console:
# Bedrock > Model access > Request model access
```

## 📚 Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [API Documentation](./API.md)

## ✅ Next Steps

1. **Deploy to AWS**: `sam deploy --guided`
2. **Get API URL** from CloudFormation outputs
3. **Update frontend** `.env` with API URL
4. **Test endpoints** with curl or Postman
5. **Monitor logs** in CloudWatch

---

**Build Status**: ✅ **SUCCESS**
**Functions**: 🚀 **8 Ready**
**Stack**: 📦 **sketch2app-backend**
