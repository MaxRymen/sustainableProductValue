export function renderSegmentPriceChart({ summary, containerId = 'segment-price-chart' }) {
  const chartDiv = document.getElementById(containerId);
  const Plotly = window.Plotly;

  if (!chartDiv || !Plotly) {
    return;
  }

  const segments = summary?.segments ?? [];

  if (!Array.isArray(segments) || segments.length === 0) {
    Plotly.purge(chartDiv);
    chartDiv.innerHTML = '<p class="empty-state">No segment pricing data available.</p>';
    return;
  }

  const names = segments.map(segment => segment.name ?? 'Segment');
  const prices = segments.map(segment => segment.recommendedPrice ?? 0);
  const tooltips = segments.map(segment => {
    const price = formatCurrency(segment.recommendedPrice ?? 0);
    const confidence = segment.confidence != null ? `${segment.confidence}% confidence` : 'Confidence not provided';
    return `${price} • ${confidence}`;
  });

  Plotly.newPlot(
    chartDiv,
    [
      {
        type: 'bar',
        x: names,
        y: prices,
        marker: {
          color: '#2563eb',
          line: {
            color: '#1d4ed8',
            width: 1,
          },
        },
        text: tooltips,
        textposition: 'outside',
        texttemplate: '%{text}',
        hoverinfo: 'none',
      },
    ],
    {
      title: {
        text: 'Recommended Price by Segment',
        font: axisFont(16),
        x: 0.02,
        xanchor: 'left',
      },
      xaxis: {
        title: { text: 'Segments', font: axisFont(14) },
        tickangle: -25,
        tickfont: axisFont(),
      },
      yaxis: {
        title: { text: 'Recommended Price ($)', font: axisFont(14) },
        tickformat: '$,.0f',
        tickfont: axisFont(),
        showgrid: true,
        gridcolor: 'rgba(148, 163, 184, 0.2)',
      },
      margin: { l: 90, r: 40, t: 80, b: 120 },
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
    },
    {
      responsive: true,
      displayModeBar: false,
    },
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

function axisFont(size = 12) {
  return {
    size,
    color: '#374151',
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  };
}

export default renderSegmentPriceChart;
