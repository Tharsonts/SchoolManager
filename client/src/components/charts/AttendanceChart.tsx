import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '@/components/ThemeProvider';

// Register all Chart.js components
Chart.register(...registerables);

export function AttendanceChart({ labels: propLabels, values: propValues }: { labels?: string[]; values?: number[] }) {
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
        
        const labels = propLabels && propLabels.length ? propLabels : ['6º Ano','7º Ano','8º Ano','9º Ano'];
        const values = propValues && propValues.length ? propValues : [95,88,85,90];
        const data = {
          labels,
          datasets: [
            {
              label: 'Frequência (%)',
              data: values,
              backgroundColor: [
                'rgba(16, 185, 129, 0.6)',
                'rgba(59, 130, 246, 0.6)',
                'rgba(245, 158, 11, 0.6)',
                'rgba(99, 102, 241, 0.6)'
              ],
              borderColor: [
                'rgba(16, 185, 129, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(99, 102, 241, 1)'
              ],
              borderWidth: 1,
              hoverOffset: 4
            }
          ]
        };
        
        // Create new chart
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
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
                callbacks: {
                  label: function(context) {
                    return `${context.label}: ${context.raw}%`;
                  }
                }
              }
            },
            cutout: '65%'
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
  }, [theme, propLabels, propValues]);
  
  return <canvas ref={chartRef} />;
}
