# Research #2: OCI Always-Free Tier Sizing

**Status**: Complete  
**Finding**: OCI always-free tier **is sufficient** for CatchUp MVP (5-10 families) with manageable constraints.

## Compute Resources

**OCI Ampere A1 (Recommended):**
- Monthly allocation: 1,500 OCPU-hours + 9,000 GB-hours
- Equivalent: 2 OCPUs + 12 GB RAM continuous
- Performance: ~500-1,000+ requests/second capacity (your peak is 100-300 requests/window)
- ✅ **Verdict: Sufficient for 5-10 families**

**Idle Reclamation Risk:**
- ⚠️ Oracle may reclaim instances if <20% CPU/network/memory utilization for 7 days
- Mitigation: Implement periodic health checks or light background jobs to maintain >20% utilization

## Database

**Status**: No managed PostgreSQL in always-free tier
- ✅ **Workaround**: Self-host PostgreSQL on the Ampere A1 compute instance
- Storage: 200 GB block storage (shared), sufficient for 30-day retention of photos/videos + metadata
- Trade-off: Manual backups (no automation), you manage patches/security
- Acceptable for MVP

## Object Storage

**Always-Free Limits:**
- 20 GB total storage
- 50,000 API requests/month

**Your Requirement:**
- 5-10 families × 75 photos/videos avg × 2-5 MB = 750 MB - 3.75 GB
- ✅ **Easily fits in 20 GB with headroom**

## Bandwidth

**Always-Free Allowance:**
- 10 TB outbound/month
- 50,000 API requests/month

**Your Estimate:**
- 300-900 requests/day × 10 MB avg = <50 GB egress/month
- ✅ **10 TB/month is 100x+ capacity**

## Overall Viability

| Component | Status |
|-----------|--------|
| Compute | ✅ Sufficient |
| Database | ⚠️ Self-hosted OK, no automation |
| Storage | ✅ Ample |
| Bandwidth | ✅ Ample |
| **Cost** | ✅ $0/month |

## Recommendation

**Deploy to always-free tier. Constraints:**
1. Monitor idle metrics (implement periodic background activity)
2. Plan manual PostgreSQL backups
3. Upgrade when exceeding 20 GB storage or scaling beyond 5-10 families
4. Estimated paid-tier cost post-MVP: $50-150/month (10-50 families)

## Sources

- [OCI Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OCI Ampere A1 Compute](https://docs.oracle.com/iaas/Content/Compute/References/arm.htm)
- [Deploy PostgreSQL on OCI Compute](https://docs.oracle.com/en/learn/oci-postgresql-cluster/index.html)
