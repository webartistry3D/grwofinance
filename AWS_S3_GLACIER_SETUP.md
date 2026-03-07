# AWS S3 + Glacier Storage Setup Guide

## Overview
This guide walks through setting up AWS S3 + Glacier storage for the GrwoFinance application, following the recommended hybrid architecture with automatic lifecycle management.

## Prerequisites
- AWS Account with appropriate permissions
- Node.js and npm installed
- GrwoFinance project cloned locally

## Step 1: AWS S3 Bucket Setup

### 1.1 Create S3 Bucket
```bash
aws s3 mb s3://your-grwofinance-bucket-name --region us-east-1
```

### 1.2 Configure Bucket Policy
Create a bucket policy file `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-grwofinance-bucket-name/*"
    }
  ]
}
```

Apply the policy:
```bash
aws s3api put-bucket-policy --bucket your-grwofinance-bucket-name --policy file://bucket-policy.json
```

## Step 2: Glacier Vault Setup

### 2.1 Create Glacier Vault
```bash
aws glacier create-vault --account-id YOUR_ACCOUNT_ID --vault-name grwofinance-archive --region us-east-1
```

### 2.2 Set Vault Access Policy
Create `vault-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/grwofinance-app"
      },
      "Action": [
        "glacier:UploadArchive",
        "glacier:InitiateJob",
        "glacier:DescribeJob",
        "glacier:GetJobOutput",
        "glacier:DeleteArchive"
      ],
      "Resource": "arn:aws:glacier:us-east-1:YOUR_ACCOUNT_ID:vaults/grwofinance-archive"
    }
  ]
}
```

Apply the policy:
```bash
aws glacier set-vault-access-policy --account-id YOUR_ACCOUNT_ID --vault-name grwofinance-archive --policy file://vault-policy.json
```

## Step 3: IAM User and Permissions

### 3.1 Create IAM User
```bash
aws iam create-user --user-name grwofinance-storage
```

### 3.2 Create IAM Policy
Create `grwofinance-storage-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject",
        "s3:GetObjectTagging",
        "s3:PutObjectTagging"
      ],
      "Resource": "arn:aws:s3:::your-grwofinance-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-grwofinance-bucket-name"
    },
    {
      "Effect": "Allow",
      "Action": [
        "glacier:UploadArchive",
        "glacier:InitiateJob",
        "glacier:DescribeJob",
        "glacier:GetJobOutput",
        "glacier:DeleteArchive",
        "glacier:ListJobs",
        "glacier:ListVaults"
      ],
      "Resource": "arn:aws:glacier:us-east-1:YOUR_ACCOUNT_ID:vaults/grwofinance-archive"
    }
  ]
}
```

Create and attach the policy:
```bash
aws iam create-policy --policy-name GrwoFinanceStoragePolicy --policy-document file://grwofinance-storage-policy.json
aws iam attach-user-policy --user-name grwofinance-storage --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/GrwoFinanceStoragePolicy
```

### 3.3 Generate Access Keys
```bash
aws iam create-access-key --user-name grwofinance-storage
```
**Save the Access Key ID and Secret Access Key securely!**

## Step 4: S3 Lifecycle Policy

### 4.1 Create Lifecycle Configuration
Create `lifecycle-config.json`:
```json
{
  "Rules": [
    {
      "ID": "ReceiptsToGlacier",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "receipts/"
      },
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 2555  // 7 years retention
      }
    }
  ]
}
```

### 4.2 Apply Lifecycle Policy
```bash
aws s3api put-bucket-lifecycle-configuration --bucket your-grwofinance-bucket-name --lifecycle-configuration file://lifecycle-config.json
```

## Step 5: Environment Configuration

### 5.1 Update .env file
```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your AWS credentials
nano .env
```

Add your AWS configuration:
```env
# Storage Configuration
STORAGE_DRIVER=s3-glacier

# AWS S3 + Glacier Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-grwofinance-bucket-name
AWS_GLACIER_VAULT_NAME=grwofinance-archive
```

## Step 6: Testing the Setup

### 6.1 Test Upload Functionality
```bash
# Start the application
npm run dev:backend

# Test file upload via the application
# Check S3 bucket: aws s3 ls s3://your-grwofinance-bucket-name/receipts/
```

### 6.2 Test Glacier Migration
```bash
# After 90 days, files should automatically move to Glacier
# Check object storage class:
aws s3api head-object --bucket your-grwofinance-bucket-name --key receipts/user/2024/01/uuid.jpg
```

## Step 7: Cost Optimization

### 7.1 Monitoring Costs
```bash
# Enable detailed monitoring
aws cloudwatch put-metric-alarm --alarm-name S3StorageCosts --metric-name BucketSizeBytes --namespace AWS/S3 --statistic Average --period 86400 --threshold 1000000000000 --comparison-operator GreaterThanThreshold --dimensions Name=BucketName,Value=your-grwofinance-bucket-name
```

### 7.2 Cost Estimates
- **S3 Standard:** $0.023/GB/month (first 50TB)
- **S3 Glacier:** $0.004/GB/month
- **S3 Glacier Deep Archive:** $0.00099/GB/month
- **Data Retrieval:** Varies by tier and speed

## Step 8: Security Best Practices

### 8.1 Enable Bucket Versioning
```bash
aws s3api put-bucket-versioning --bucket your-grwofinance-bucket-name --versioning-configuration Status=Enabled
```

### 8.2 Enable Server-Side Encryption
```bash
aws s3api put-bucket-encryption --bucket your-grwofinance-bucket-name --server-side-encryption-configuration file://encryption-config.json
```

### 8.3 Enable Access Logging
```bash
aws s3api put-bucket-logging --bucket your-grwofinance-bucket-name --bucket-logging-status file://logging-config.json
```

## Troubleshooting

### Common Issues
1. **Access Denied**: Check IAM permissions and bucket policies
2. **Glacier Restore Delays**: Glacier restores take 3-12 hours depending on tier
3. **Lifecycle Policy Not Working**: Verify policy syntax and bucket permissions
4. **Cost Overruns**: Monitor usage and set up CloudWatch alerts

### Debug Commands
```bash
# Check bucket policies
aws s3api get-bucket-policy --bucket your-grwofinance-bucket-name

# Check lifecycle configuration
aws s3api get-bucket-lifecycle-configuration --bucket your-grwofinance-bucket-name

# Check object storage class
aws s3api head-object --bucket your-grwofinance-bucket-name --key receipts/user/2024/01/test.jpg

# List Glacier jobs
aws glacier list-jobs --account-id YOUR_ACCOUNT_ID --vault-name grwofinance-archive
```

## Migration from Local Storage

### Gradual Migration Strategy
1. **Phase 1**: Set up S3 + Glacier alongside local storage
2. **Phase 2**: Enable dual-write (write to both local and S3)
3. **Phase 3**: Switch to S3-only for new uploads
4. **Phase 4**: Migrate existing local files to S3
5. **Phase 5**: Decommission local storage

### Batch Migration Script
```bash
#!/bin/bash
# Migrate existing local files to S3
for file in uploads/dev/receipts/*/*/*/*; do
    if [ -f "$file" ]; then
        aws s3 cp "$file" "s3://your-grwofinance-bucket-name/receipts/$(basename $(dirname $(dirname $(dirname $file))))/$(basename $file)"
    fi
done
```

## Monitoring and Maintenance

### CloudWatch Metrics to Monitor
- S3 Bucket Size (Bytes)
- Number of Objects
- Glacier Storage Class Transitions
- Data Transfer Out
- API Request Counts

### Regular Maintenance Tasks
- Review access logs monthly
- Monitor cost trends quarterly
- Update IAM credentials annually
- Test disaster recovery procedures semi-annually

This setup provides a robust, cost-effective storage solution with automatic lifecycle management for your GrwoFinance application.
