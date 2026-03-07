# GrwoFinance -- AWS S3 + Glacier Cost Projection Report

## Assumptions

-   Storage per user: **50 MB/month (0.05 GB)**
-   Lifecycle policy:
    -   Day 0--30 → S3 Standard
    -   Day 31--120 → Glacier Instant Retrieval
    -   Day 121--210 → Glacier Flexible Retrieval
    -   Day 211+ → Glacier Deep Archive

------------------------------------------------------------------------

## AWS Pricing Used

  Storage Tier                 Cost / GB
  ---------------------------- -----------
  S3 Standard                  \$0.023
  Glacier Instant Retrieval    \$0.004
  Glacier Flexible Retrieval   \$0.0036
  Glacier Deep Archive         \$0.00099

------------------------------------------------------------------------

## Steady-State Tier Distribution

  Tier               \% of Total Data
  ------------------ ------------------
  Standard           14%
  Glacier Instant    43%
  Glacier Flexible   29%
  Deep Archive       14%

------------------------------------------------------------------------

## Weighted Average Cost

≈ **\$0.00037 per user / month**

------------------------------------------------------------------------

## Monthly Storage Cost Projection

  Users     Storage   Cost ($) | Cost (₦ @1600/$)   
  --------- --------- ----------------------------- ---------
  1,000     50 GB     \$0.37                        ₦830
  5,000     250 GB    \$1.85                        ₦4,160
  10,000    500 GB    \$3.70                        ₦8,320
  50,000    2.5 TB    \$18.50                       ₦41,600
  100,000   5 TB      \$37.00                       ₦83,200

------------------------------------------------------------------------

## Estimated Monthly Request Costs

  Users     Requests    Cost (\$)
  --------- ----------- -----------
  1,000     30,000      \$0.15
  5,000     150,000     \$0.75
  10,000    300,000     \$1.50
  50,000    1,500,000   \$7.50
  100,000   3,000,000   \$15.00

------------------------------------------------------------------------

## Total Monthly Cost (Storage + Requests)

  Users     Total (\$)   Total (₦)
  --------- ------------ -----------
  1,000     \$0.52       ₦830
  5,000     \$2.60       ₦4,160
  10,000    \$5.20       ₦8,320
  50,000    \$26.00      ₦41,600
  100,000   \$52.00      ₦83,200

------------------------------------------------------------------------

## Conclusion

AWS S3 + Glacier with lifecycle policies provides **extremely low
storage cost even at large scale**.

At **100,000 users**, total monthly object storage + request cost is:

> **≈ ₦83,000/month**

This makes AWS S3 **ideal for KudiTracker's MVP and long-term scaling
strategy.**

------------------------------------------------------------------------

## Recommended Lifecycle Policy

    Day 0   → S3 Standard  
    Day 30  → Glacier Instant Retrieval  
    Day 120 → Glacier Flexible Retrieval  
    Day 210 → Glacier Deep Archive  

------------------------------------------------------------------------

## Key Benefits

-   Ultra-low long-term cost
-   Automatic tiering
-   No operational overhead
-   Massive scalability
-   Predictable monthly spend

------------------------------------------------------------------------

Prepared for: **GrwoFinance MVP Infrastructure Planning**
