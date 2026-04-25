// Weight Training Analysis Module
(function() {
  'use strict';

  // Chart.js instance
  let chartInstance = null;

  /**
   * Get records from state
   */
  function getRecords() {
    const state = WTCore.safeGetState();
    return state.records || [];
  }

  /**
   * Get exercises from state
   */
  function getExercises() {
    const state = WTCore.safeGetState();
    return state.exercises || [];
  }

  /**
   * Group records by exercise
   */
  function groupByExercise(records) {
    const grouped = {};
    records.forEach(record => {
      const exerciseId = record.exerciseId || 'unknown';
      if (!grouped[exerciseId]) {
        grouped[exerciseId] = [];
      }
      grouped[exerciseId].push(record);
    });
    return grouped;
  }

  /**
   * Get unique exercise names
   */
  function getExerciseNames() {
    const exercises = getExercises();
    return exercises.map(ex => ex.name).filter(name => name);
  }

  /**
   * Get records grouped by date
   */
  function getRecordsByDate(records) {
    const byDate = {};
    records.forEach(record => {
      const date = record.date || new Date().toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = [];
      }
      byDate[date].push(record);
    });
    return byDate;
  }

  /**
   * Calculate total weight lifted per exercise
   */
  function calculateTotalWeight(exerciseRecords) {
    return exerciseRecords.reduce((sum, record) => {
      const weight = parseFloat(record.weight) || 0;
      const sets = record.sets || 1;
      return sum + (weight * sets);
    }, 0);
  }

  /**
   * Get max weight per exercise
   */
  function getMaxWeight(exerciseRecords) {
    let max = 0;
    exerciseRecords.forEach(record => {
      const weight = parseFloat(record.weight) || 0;
      if (weight > max) max = weight;
    });
    return max;
  }

  /**
   * Destroy existing chart
   */
  function destroyChart() {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  /**
   * Create bar chart for exercise performance
   */
  function createExerciseChart(ctxId) {
    const ctx = document.getElementById(ctxId);
    if (!ctx) return;

    destroyChart();

    const exerciseNames = getExerciseNames();
    const exerciseRecords = groupByExercise(getRecords());
    const labels = exerciseNames;
    const dataWeights = labels.map(name => {
      const records = exerciseRecords[name] || [];
      return calculateTotalWeight(records);
    });
    const dataMaxWeights = labels.map(name => {
      const records = exerciseRecords[name] || [];
      return getMaxWeight(records);
    });

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Weight (kg)',
            data: dataWeights,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Max Weight (kg)',
            data: dataMaxWeights,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Exercise Performance'
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Weight (kg)'
            }
          }
        }
      }
    });
  }

  /**
   * Create line chart for progress over time
   */
  function createProgressChart(ctxId) {
    const ctx = document.getElementById(ctxId);
    if (!ctx) return;

    destroyChart();

    const records = getRecords();
    const grouped = getRecordsByDate(records);
    
    const labels = Object.keys(grouped).sort();
    const dataWeights = labels.map(date => {
      const recs = grouped[date];
      const total = recs.reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
      return total;
    });

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Total Weight (kg)',
          data: dataWeights,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Training Progress Over Time'
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Weight (kg)'
            }
          }
        }
      }
    });
  }

  /**
   * Update all charts
   */
  function updateCharts() {
    createExerciseChart('exerciseChart');
    createProgressChart('progressChart');
  }

  /**
   * Initialize module
   */
  function init() {
    // Check if charts container exists
    const exerciseChartContainer = document.getElementById('exerciseChart');
    const progressChartContainer = document.getElementById('progressChart');

    if (exerciseChartContainer) {
      createExerciseChart('exerciseChart');
    }

    if (progressChartContainer) {
      createProgressChart('progressChart');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.WTAnalysis = { init: init };
})();