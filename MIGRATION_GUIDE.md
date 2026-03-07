# GrwoFinance Production Migration Guide

## 🎯 Current Status
- **Local Development**: Working with `STORAGE_DRIVER=local`
- **Production Ready**: S3 bucket `grwofinance-glacier-policy` configured
- **Database**: PostgreSQL with credentials ready

---

## 🚀 Migration Steps

### Step 1: Update Your Local .env

Your current `.env` has these values:
```bash
DATABASE_URL=postgresql://grwofinance:grwofinance1706@localhost:5432/grwofinance
SESSION_SECRET=09b7b11941540e8f52d26374b8a35b6bbe4edf3fdb5ed7c32adacd48b1732992
STORAGE_DRIVER=local
```

**Add AWS credentials:**
```bash
# Add these lines to your existing .env
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=grwofinance-glacier-policy
AWS_GLACIER_VAULT_NAME=grwofinance-glacier-vault
AWS_ACCOUNT_ID=your_aws_account_id_here
```

### Step 2: Test S3 Integration Locally

**Update storage driver:**
```bash
# Change this line in your .env
STORAGE_DRIVER=s3-glacier
```

**Test upload locally:**
```bash
npm run dev:backend
# Test receipt upload to verify S3 works
```

### Step 3: Production Deployment

**Option A: Change .env for Production**
```bash
# Update these lines in .env
STORAGE_DRIVER=s3-glacier
NODE_ENV=production
PORT=5000
```

**Option B: Use Environment Variables (Recommended)**
```bash
# Set in your hosting environment
export STORAGE_DRIVER=s3-glacier
export NODE_ENV=production
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
# ... other AWS vars
```

---

## 🔧 Migration Commands

### 1. Backup Current Data
```bash
# Backup local storage (if any)
cp -r uploads/ uploads-backup/
```

### 2. Test Migration
```bash
# Start with S3 driver locally
STORAGE_DRIVER=s3-glacier npm run dev:backend

# Verify uploads work
curl -X POST http://localhost:5000/api/expenses/receipt \
  -F "file=@test.jpg" \
  -H "Authorization: Bearer your_test_token"
```

### 3. Deploy to Production
```bash
# Build for production
npm run build

# Deploy with production settings
NODE_ENV=production STORAGE_DRIVER=s3-glacier npm start
```

---

## 📋 Migration Checklist

### ✅ Pre-Migration:
- [ ]**🎯 Your GrwoFinance setup is ready!** 

The storage system will automatically handle the lifecycle transitions you've configured in AWS, ensuring optimal cost efficiency while maintaining access to recent receipts.

### ✅ Migration:
- [ ] Update `.env` with AWS credentials
- [ ] Change `STORAGE_DRIVER=s3-glacier`
- [ ] Test uploads locally
- [ ] Build application
- [ ] Deploy to production

### ✅ Post-Migration:
- [ ] Verify uploads work in production
- [ ] Check image retrieval works
- [ ] Monitor CloudWatch for errors
- [ ] Test Glacier restore functionality

---

## 🔍 Testing Your Migration

### 1. Upload Test
```bash
# Test new receipt upload
curl -X POST https://your-domain.com/api/expenses/receipt \
  -F "file=@test-receipt.jpg" \
  -H "Authorization: Bearer production_jwt_token"
```

### 2. Retrieval Test
```bash
# Test image access (should work immediately)
curl "https://your-domain.com/uploads/dev/receipts/userId/2024/01/uuid.jpg"

# Test old image restore (should initiate Glacier restore)
# Will return: "File is in cold storage. Restore initiated..."
```

### 3. Lifecycle Test
```bash
# Verify files move through lifecycle stages
# Day 0-30: S3 Standard (instant access)
# Day 30-120: Glacier Instant (3-5 minutes)
# Day 120-210: Glacier Flexible (3-12 hours)
# Day 210+: Deep Archive (12+ hours)
```

---

## 🚨 Troubleshooting

### Common Migration Issues:

1. **"Missing required AWS environment variables"**
   ```bash
   # Check your .env has all AWS variables
   cat .env | grep AWS_
   ```

2. **"Access Denied" errors**
   ```bash
   # Verify IAM permissions include:
   # - s3:PutObject, s3:GetObject, s3:DeleteObject
   # - glacier:InitiateJob, glacier:DescribeJob
   ```

3. **"Bucket not found"**
   ```bash
   # Verify bucket exists and is in correct region
   aws s3 ls s3://grwofinance-glacier-policy
   ```

4. **Files not appearing after upload**
   ```bash
   # Check S3 bucket directly
   aws s3 ls s3://grwofinance-glacier-policy/receipts/
   ```

---

## 📊 Cost Monitoring

### Expected Monthly Costs:
- **Storage**: ~₦83,200 (at 100K users)
- **Requests**: ~₦15,000 (at 100K users)
- **Data Transfer**: ~₦10,000 (estimate)

### CloudWatch Metrics to Watch:
- `NumberOfObjects` - Total files stored
- `BucketSizeBytes` - Storage usage by class
- `AllRequests` - API request count
- `4xxErrors` - Access denied errors

---

## 🎯 Migration Success Criteria

✅ **Uploads work**: New receipts save to S3  
✅ **Retrieval works**: Recent images load instantly  
✅ **Lifecycle active**: Files transition to Glacier automatically  
✅ **No errors**: Clean logs in CloudWatch  
✅ **Cost optimized**: Using cheapest storage class for age  

---

## 🚀 Ready for Production!

Your `.env.example` is now migration-ready with:
- ✅ Current database credentials
- ✅ S3 Glacier configuration  
- ✅ Clear migration instructions
- ✅ Production deployment guide

**Next**: Add your AWS credentials and migrate! 🎯
