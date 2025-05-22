import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '@/components/ThemeProvider';

// Register all Chart.js components
Chart.register(...registerables);

export function PerformanceChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { theme } = useTheme();
  
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        // Destroy previous chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
        
        // Define colors based on theme
        const textColor = theme === 'dark' ? '#e5e7eb' : '#4b5563';
        const gridColor = theme === 'dark' ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.5)';
        
        // Sample data - in a real app, this would come from an API
        const data = {
          labels: ['9º Ano A', '9º Ano B', '8º Ano A', '8º Ano B', '7º Ano A', '7º Ano B', '6º Ano A', '6º Ano B'],
          datasets: [
            {
              label: 'Média atual',
              data: [8.2, 7.5, 7.8, 7.2, 8.0, 7.6, 8.3, 7.9],
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2,
              borderRadius: 5,
            },
            {
              label: 'Período anterior',
              data: [7.9, 7.2, 7.5, 6.8, 7.7, 7.3, 8.0, 7.5],
              backgroundColor: 'rgba(209, 213, 219, 0.5)',
              borderColor: 'rgba(209, 213, 219, 1)',
              borderWidth: 2,
              borderRadius: 5,
            }
          ]
        };
        
        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  boxWidth: 12,
                  padding: 15,
                  font: {
                    size: 12,
                  },
                  color: textColor
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: textColor,
                  font: {
                    size: 11
                  }
                }
              },
              y: {
                min: 0,
                max: 10,
                grid: {
                  color: gridColor
                },
                ticks: {
                  color: textColor,
                  font: {
                    size: 11
                  },
                  stepSize: 2
                }
              }
            }
          }
        });
      }
    }
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [theme]); // Re-render chart when theme changes
  
  return <canvas ref={chartRef} />;
}
