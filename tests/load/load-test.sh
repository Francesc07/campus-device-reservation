#!/bin/bash
# Load Testing Script for Device Reservation Service
# Uses Apache Bench (ab) or wrk to simulate high load
# Run with: ./load-test.sh <environment> <concurrency> <total-requests>

set -e

ENVIRONMENT=${1:-dev}
CONCURRENCY=${2:-50}
TOTAL_REQUESTS=${3:-1000}

# Function URLs
BASE_URL="https://devicereservation-${ENVIRONMENT}-ab07-func.azurewebsites.net"
TEST_ENDPOINT="${BASE_URL}/api/test"

echo "=================================================="
echo "   Device Reservation Service - Load Test"
echo "=================================================="
echo "Environment: ${ENVIRONMENT}"
echo "Endpoint: ${TEST_ENDPOINT}"
echo "Concurrency: ${CONCURRENCY}"
echo "Total Requests: ${TOTAL_REQUESTS}"
echo "=================================================="
echo ""

# Check if ab (Apache Bench) is installed
if command -v ab &> /dev/null; then
    echo "📊 Running load test with Apache Bench..."
    echo ""
    
    ab -n ${TOTAL_REQUESTS} \
       -c ${CONCURRENCY} \
       -g load-test-results.tsv \
       -e load-test-results.csv \
       "${TEST_ENDPOINT}"
    
    echo ""
    echo "✅ Load test completed"
    echo "📄 Results saved to:"
    echo "   - load-test-results.tsv"
    echo "   - load-test-results.csv"
    
elif command -v wrk &> /dev/null; then
    echo "📊 Running load test with wrk..."
    echo ""
    
    DURATION=$((TOTAL_REQUESTS / CONCURRENCY / 10))  # Approximate duration
    
    wrk -t${CONCURRENCY} \
        -c${CONCURRENCY} \
        -d${DURATION}s \
        --latency \
        "${TEST_ENDPOINT}"
    
    echo ""
    echo "✅ Load test completed"
    
else
    echo "❌ Error: Neither 'ab' (Apache Bench) nor 'wrk' is installed"
    echo "Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install apache2-utils"
    echo "  Mac: brew install wrk"
    exit 1
fi

# Generate summary report
echo ""
echo "=================================================="
echo "   Test Summary"
echo "=================================================="
echo "Test completed at: $(date)"
echo ""

# Check for errors in results if using ab
if [ -f "load-test-results.csv" ]; then
    echo "📈 Response Time Distribution:"
    tail -n +2 load-test-results.csv | awk -F',' '{
        sum+=$2; count++
        if(min==""){min=max=$2}
        if($2>max){max=$2}
        if($2<min){min=$2}
    } END {
        print "  Average: " sum/count " ms"
        print "  Min: " min " ms"
        print "  Max: " max " ms"
    }'
fi

echo ""
echo "🎯 Test complete! Check Azure Monitor for detailed metrics."
echo "   Portal: https://portal.azure.com/#view/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade"
