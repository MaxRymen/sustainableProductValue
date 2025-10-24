export function renderWaterfallChart(results) {
  const chartDiv = document.getElementById('waterfall-chart');
  const Plotly = window.Plotly;

  if (!chartDiv || !Plotly) {
    return;
  }

  const nbaValue = results?.step1_nbaValue?.nbaValue ?? 0;
  const differentiators = results?.step2_valueDifferentiators?.differentiators ?? [];

  const x = ['NBA Value'];
  const y = [nbaValue];
  const measure = ['absolute'];
  const text = [`${formatCurrency(nbaValue)}`];
  const colors = ['#2563eb'];

  let differentiatorSum = 0;
  differentiators.forEach(diff => {
    const value = diff.value ?? 0;
    differentiatorSum += value;
    x.push(diff.name ?? 'Differentiator');
    y.push(value);
    measure.push('relative');
    text.push(`+${formatCurrency(value)}`);
    colors.push('#22c55e');
  });

  const total = nbaValue + differentiatorSum;
  x.push('Willingness to Pay');
  y.push(total);
  measure.push('total');
  text.push(`${formatCurrency(total)}`);
  colors.push('#16a34a');

  Plotly.newPlot(
    chartDiv,
    [
      {
        type: 'waterfall',
        x,
        y,
        measure,
        text,
        textposition: 'outside',
        texttemplate: '<b>%{text}</b>',
        connector: {
          line: {
            color: 'rgba(148, 163, 184, 0.5)',
            width: 2,
          },
        },
        marker: {
          color: colors,
          line: {
            color: colors,
            width: 2,
          },
        },
        textfont: {
          size: 13,
          color: '#1e293b',
          family:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
        },
      },
    ],
    {
      xaxis: {
        showgrid: false,
        tickangle: -45,
        tickfont: axisFont(),
        automargin: true,
      },
      yaxis: {
        title: { text: 'Value ($)', font: axisFont(14) },
        showgrid: true,
        gridcolor: 'rgba(148, 163, 184, 0.2)',
        tickformat: '$,.0f',
        tickfont: axisFont(),
      },
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      margin: { l: 120, r: 80, t: 60, b: 200 },
      showlegend: false,
      hovermode: 'closest',
      font: axisFont(),
    },
    {
      responsive: true,
      displayModeBar: false,
      staticPlot: false,
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

export default renderWaterfallChart;
