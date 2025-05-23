import useSWR from 'swr';
import { preload } from 'swr';
import { useState, useEffect } from 'react';

// A simple fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Preload the data (new feature in SWR)
preload('https://jsonplaceholder.typicode.com/todos/1', fetcher);

export default function DataFetcher() {
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [lastFocusTime, setLastFocusTime] = useState<string>('Never');
  const [focusCount, setFocusCount] = useState(0);
  const [browserInfo, setBrowserInfo] = useState('');

  // Using SWR to fetch data with more options
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    'https://jsonplaceholder.typicode.com/todos/1',
    fetcher,
    {
      refreshInterval: refreshInterval,   // Auto refresh interval
      revalidateOnFocus: true,            // Revalidate when window gets focused
      revalidateIfStale: true,            // Automatically revalidate stale data
      focusThrottleInterval: 0,           // No throttling for focus events
      dedupingInterval: 0,                // No deduping interval
    }
  );

  // Add a manual focus event listener to debug Chrome's focus behavior
  useEffect(() => {
    // Get browser information
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      setBrowserInfo(userAgent);
    }

    const handleFocus = () => {
      setFocusCount(prev => prev + 1);
      setLastFocusTime(new Date().toLocaleTimeString());
      console.log('Window focus event detected at', new Date().toLocaleTimeString());

      // Manually trigger revalidation on focus
      mutate();
    };

    window.addEventListener('focus', handleFocus);

    // Also try the visibilitychange event which might be more reliable in Chrome
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Document became visible at', new Date().toLocaleTimeString());
        setLastFocusTime(new Date().toLocaleTimeString() + ' (visibility)');
        setFocusCount(prev => prev + 1);

        // Manually trigger revalidation
        mutate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mutate]);

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setRefreshInterval(refreshInterval === 0 ? 3000 : 0);
  };

  // Manual refresh
  const refreshData = () => {
    mutate(); // Trigger a revalidation
  };

  if (error) return <div>Failed to load data</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="swr-example">
      <h2>SWR Data Fetching Example</h2>
      <p>Todo title: {data.title}</p>
      <p>Completed: {data.completed ? 'Yes' : 'No'}</p>
      <p>User ID: {data.userId}</p>
      <p>SWR version 2.3.3 is working correctly!</p>

      <div style={{ marginTop: '20px' }}>
        <button onClick={refreshData} style={{ marginRight: '10px' }}>
          Manual Refresh {isValidating && '...'}
        </button>
        <button onClick={toggleAutoRefresh}>
          {refreshInterval > 0 ? 'Disable' : 'Enable'} Auto Refresh ({refreshInterval > 0 ? 'Every 3s' : 'Off'})
        </button>
      </div>

      {/* Debug information */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Debug Information</h3>
        <p><strong>Browser:</strong> {browserInfo}</p>
        <p><strong>Focus Events Detected:</strong> {focusCount}</p>
        <p><strong>Last Focus Event:</strong> {lastFocusTime}</p>
        <p><strong>Currently Validating:</strong> {isValidating ? 'Yes' : 'No'}</p>
        <p><strong>Auto Refresh:</strong> {refreshInterval > 0 ? `Every ${refreshInterval}ms` : 'Off'}</p>
        <p style={{ marginTop: '10px', fontSize: '11px' }}>
          <strong>Testing Instructions:</strong> Switch to another tab or application, then come back to this tab.
          The data should automatically refresh and the focus count should increase.
        </p>
      </div>
    </div>
  );
}
