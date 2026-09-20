import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '@/components/ThemeProvider';

// Register all Chart.js components
Chart.register(...registerables);

export function GradeDistributionChart({ buckets }: { buckets?: number[] }) {
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
        
        const values = buckets && buckets.length === 5 ? buckets : [5,25,140,320,96];
        const data = {
          labels: ['0-2','2-4','4-6','6-8','8-10'],
          datasets: [
            {
              label: 'Número de Alunos',
              data: values,
              backgroundColor: [
                'rgba(239, 68, 68, 0.7)',
                'rgba(245, 158, 11, 0.7)',
                'rgba(250, 204, 21, 0.7)',
                'rgba(16, 185, 129, 0.7)',
                'rgba(37, 99, 235, 0.7)'
              ],
              borderColor: [
                'rgba(239, 68, 68, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(250, 204, 21, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(37, 99, 235, 1)'
              ],
              borderWidth: 1
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
            indexAxis: 'x',
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  title: function(items) {
                    const item = items[0];
                    return `Notas entre ${item.label}`;
                  },
                  label: function(context) {
                    return `${context.raw} alunos`;
                  }
                }
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Faixa de Notas',
                  color: textColor,
                  font: {
                    size: 12,
                    weight: 'bold'
                  }
                },
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
                title: {
                  display: true,
                  text: 'Número de Alunos',
                  color: textColor,
                  font: {
                    size: 12,
                    weight: 'bold'
                  }
                },
                grid: {
                  color: gridColor
                },
                ticks: {
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
  }, [theme, buckets]);
  
  return <canvas ref={chartRef} />;
}
