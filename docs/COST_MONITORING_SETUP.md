# Cost Monitoring Setup Guide

## OpenAI Cost Monitoring

### 1. Set Up Spending Limits

1. Go to OpenAI Dashboard: https://platform.openai.com/usage
2. Navigate to **Settings → Limits**
3. Set **Hard Limit**: $X per month (recommended: $50-100 to start)
4. Set **Soft Limit Alert**: $Y per month (recommended: $25-50)
5. Enable email alerts

### 2. Monitor Usage

**Daily Check:**
- OpenAI Dashboard → Usage
- Track: API calls, tokens used, cost per day

**Key Metrics:**
- Cost per scan: ~$0.01-0.03
- Free tier users: 10 scans/month = ~$0.10-0.30/user/month
- Break-even: Need 2-5% conversion to PRO

### 3. Cost Alerts

Set up alerts for:
- Daily spend > $10
- Monthly spend > $100
- Unusual spike in API calls

### 4. Emergency Shutoff

If costs spike unexpectedly:
1. Set OpenAI hard limit to $0 (stops all API calls)
2. Check backend logs for abuse
3. Review quota enforcement
4. Re-enable with lower limit

## Backend Monitoring

### Add Cost Tracking Endpoint

```python
@app.route('/api/cost-stats', methods=['GET'])
def cost_stats():
    """Get cost statistics (admin only)"""
    # Count total scans this month
    # Estimate cost
    # Return stats
    pass
```

### Log All API Calls

Ensure all OpenAI API calls are logged with:
- User ID
- Timestamp
- Cost (if available)
- Success/failure

## Recommended Limits

**Starting Out:**
- Free tier: 5 scans/month (reduces cost exposure)
- OpenAI hard limit: $50/month
- Monitor first 100 users closely

**After Launch:**
- Free tier: 10 scans/month (if conversion rate is good)
- OpenAI hard limit: $200-500/month
- Daily monitoring

## Break-Even Analysis

**Assumptions:**
- Cost per scan: $0.02
- Free tier: 10 scans/month
- PRO price: $5/month

**Per 100 Free Users:**
- Cost: 100 users × 10 scans × $0.02 = $20/month
- Need: 4 PRO users to break even (4% conversion)

**Per 1000 Free Users:**
- Cost: 1000 users × 10 scans × $0.02 = $200/month
- Need: 40 PRO users to break even (4% conversion)

**Target Conversion Rate: 5-10%** (healthy SaaS)
