<template>
  <v-card class="rounded-xl pa-4" color="rgb(150 150 150 / 9%)" flat>
    <LineChartGenerator
      v-if="tags.length"
      :data="datasets"
      :options="chartOptions"
      :chart-id="chartId"
      :dataset-id-key="datasetIdKey"
      :plugins="plugins"
      :css-classes="cssClasses"
      :styles="styles"
      :width="width"
      :height="height"
    />
  </v-card>
</template>

<script>
import {Line as LineChartGenerator} from 'vue-chartjs'

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement
)

export default {
  name: 'ChartTags',
  components: {
    LineChartGenerator
  },
  props: {
    chartId: {
      type: String,
      default: 'line-chart'
    },
    datasetIdKey: {
      type: String,
      default: 'label'
    },
    width: {
      type: Number,
      default: 100
    },
    height: {
      type: Number,
      default: 100
    },
    cssClasses: {
      default: '',
      type: String
    },
    styles: {
      type: Object,
      default: () => {
      }
    },
    plugins: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    chartData: {
      labels: ['January',],
      datasets: [
        {
          label: 'Added',
          backgroundColor: '#8af879',
          data: [40,],
        },
      ],
    },
    chartOptions: {
      // responsive: true,
      // maintainAspectRatio: false
      // scales: {
      //   x: {
      //     type: 'timeseries',
      //   }
      // },
    },
  }),
  computed: {
    tags() {
      return this.$store.state.tags;
    },
    datasets() {
      let labels = []
      const getDataset = (param, color) => {
        let dates = this.tags.map(i => new Date(i[param]));
        dates = _.sortBy(dates, (i) => i.getTime());
        let start = dates[0];
        let end = dates[dates.length - 1];

        // даты за каждый день в промежутке между двумя датами
        const getDaysArray = function (s, e) {
          const a = [];
          for (const d = new Date(s); d <= new Date(e); d.setDate(d.getDate() + 1)) {
            a.push(d.toLocaleDateString());
          }
          return a;
        };

        dates = dates.map(i => i.toLocaleDateString());
        let grouped = _.groupBy(dates);

        const days = getDaysArray(start, end);
        const res = days.map(i => grouped[i] ? grouped[i].length : null);

        if (param === 'createdAt') {
          labels = days;
        }

        return {
          data: res,
          label: param,
          backgroundColor: color,
        };
      }

      const params = [
        {text: 'createdAt', color: '#E1CB5AFF'},
        {text: 'updatedAt', color: '#8AF879FF'},
      ];
      let data = [];
      for (let i of params) {
        data.push(getDataset(i.text, i.color));
      }
      console.log(labels)
      console.log(data)
      return {
        labels: labels,
        datasets: data,
      }
    },
  },
}
</script>
