import React from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useLanguage } from '../context/LanguageContext';
import { getRankNameAr, getRankNameEn } from '../utils/rankHelpers';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const MembersByRankChart = ({ data }) => {
  const { language } = useLanguage();

  const rankColors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336', '#00BCD4', '#CDDC39', '#FF5722', '#3F51B5'];

  const chartData = {
    labels: data.map(item => language === 'ar' ? getRankNameAr(item._id) : getRankNameEn(item._id)),
    datasets: [{
      data: data.map(item => item.count),
      backgroundColor: rankColors,
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: language === 'ar' ? 'right' : 'right',
        rtl: language === 'ar',
        labels: {
          font: { size: 12 },
          padding: 15
        }
      },
      title: {
        display: true,
        text: language === 'ar' ? 'توزيع الأعضاء حسب الرتبة' : 'Members Distribution by Rank',
        font: { size: 16, weight: 'bold' }
      }
    }
  };

  return <Doughnut data={chartData} options={options} />;
};

export const MembersByRegionChart = ({ data }) => {
  const { language } = useLanguage();

  const chartData = {
    labels: data.map(item => language === 'ar' ? (item.regionName || 'غير محدد') : (item.regionNameEn || 'Unspecified')),
    datasets: [{
      label: language === 'ar' ? 'عدد الأعضاء' : 'Number of Members',
      data: data.map(item => item.count),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: language === 'ar' ? 'توزيع الأعضاء حسب المنطقة' : 'Members Distribution by Region',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export const GrowthChart = ({ memberGrowth, orderGrowth }) => {
  const { language } = useLanguage();

  const monthNames = language === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const labels = memberGrowth.map(item => `${monthNames[item._id.month - 1]} ${item._id.year}`);

  const chartData = {
    labels,
    datasets: [
      {
        label: language === 'ar' ? 'الأعضاء الجدد' : 'New Members',
        data: memberGrowth.map(item => item.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      },
      {
        label: language === 'ar' ? 'الطلبات' : 'Orders',
        data: orderGrowth.map(item => item.count),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: language === 'ar' ? 'نمو الشركة - آخر 12 شهر' : 'Company Growth - Last 12 Months',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
};

export const RevenueGrowthChart = ({ orderGrowth }) => {
  const { language } = useLanguage();

  const monthNames = language === 'ar'
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const labels = orderGrowth.map(item => `${monthNames[item._id.month - 1]} ${item._id.year}`);

  const chartData = {
    labels,
    datasets: [
      {
        label: language === 'ar' ? 'الإيرادات ($)' : 'Revenue ($)',
        data: orderGrowth.map(item => item.revenue || 0),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: language === 'ar' ? 'نمو الإيرادات - آخر 12 شهر' : 'Revenue Growth - Last 12 Months',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(0);
          }
        }
      }
    }
  };

  return <Line data={chartData} options={options} />;
};
