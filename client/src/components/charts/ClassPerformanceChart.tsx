import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '@/components/ThemeProvider';

// Register all Chart.js components
Chart.register(...registerables);

export function ClassPerformanceChart() {
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
          labels: ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês', 'Artes', 'Ed. Física'],
          datasets: [
            {
              label: 'Nota Atual',
              data: [9.2, 8.5, 7.8, 8.0, 7.5, 9.0, 8.8, 9.5],
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(59, 130, 246, 1)',
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true
            },
            {
              label: 'Média da Turma',
              data: [7.5, 7.8, 7.2, 7.6, 7.0, 7.9, 8.3, 8.8],
              backgroundColor: 'rgba(249, 115, 22, 0.2)',
              borderColor: 'rgba(249, 115, 22, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(249, 115, 22, 1)',
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true
            }
          ]
        };
        
        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'radar',
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
              line: {
                tension: 0.2
              }
            },
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
              r: {
                min: 0,
                max: 10,
                ticks: {
                  stepSize: 2,
                  color: textColor,
                  backdropColor: theme === 'dark' ? '#1f2937' : '#ffffff'
                },
                grid: {
                  color: gridColor
                },
                pointLabels: {
                  color: textColor,
                  font: {
                    size: 11
                  }
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
