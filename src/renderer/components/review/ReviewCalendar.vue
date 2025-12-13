<template>
  <div class="review-calendar">
    <!-- 日历头部 -->
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">
        <span class="arrow">‹</span>
      </button>
      <span class="month-title">{{ monthTitle }}</span>
      <button class="nav-btn" @click="nextMonth">
        <span class="arrow">›</span>
      </button>
    </div>

    <!-- 星期标题 -->
    <div class="weekday-row">
      <span v-for="day in weekDays" :key="day" class="weekday">
        {{ day }}
      </span>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-grid">
      <div
        v-for="cell in calendarCells"
        :key="cell.date"
        class="day-cell"
        :class="[
          cell.status,
          { today: isToday(cell.date), other: !cell.isCurrentMonth }
        ]"
        :title="getDayTooltip(cell)"
      >
        <span class="day-number">{{ cell.day }}</span>
        <span v-if="cell.status !== 'empty'" class="day-dot"></span>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot pending"></span>
        <span>{{ t('review.calendar.pending') }}</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot incomplete"></span>
        <span>{{ t('review.calendar.incomplete') }}</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot completed"></span>
        <span>{{ t('review.calendar.completed') }}</span>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CalendarDay } from '../../../shared/types/review';

const { t, locale } = useI18n();

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);

// API 返回的数据
const calendarDays = ref<CalendarDay[]>([]);

/* ================= 星期标题 ================= */

const weekDays = computed(() =>
  locale.value === 'zh-CN'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
);

/* ================= 月份标题 ================= */

const monthTitle = computed(() => {
  if (locale.value === 'zh-CN') {
    return `${currentYear.value}年${currentMonth.value}月`;
  }
  return new Date(currentYear.value, currentMonth.value - 1).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'long' }
  );
});

/* ================= 今天 ================= */

const todayStr = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
})();

function isToday(date: string) {
  return date === todayStr;
}

/* ================= 日历格子生成（核心修复） ================= */

const calendarCells = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();

  const apiMap = new Map(calendarDays.value.map(d => [d.date, d]));

  const cells = [];

  for (let i = 0; i < 42; i++) {
    let day: number;
    let cellMonth = month;
    let cellYear = year;
    let isCurrentMonth = true;

    if (i < firstDay) {
      // 上个月
      day = prevMonthDays - firstDay + i + 1;
      cellMonth--;
      isCurrentMonth = false;
    } else if (i >= firstDay + daysInMonth) {
      // 下个月
      day = i - firstDay - daysInMonth + 1;
      cellMonth++;
      isCurrentMonth = false;
    } else {
      // 本月
      day = i - firstDay + 1;
    }

    if (cellMonth === 0) {
      cellMonth = 12;
      cellYear--;
    }
    if (cellMonth === 13) {
      cellMonth = 1;
      cellYear++;
    }

    const dateStr = `${cellYear}-${String(cellMonth).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;

    const apiData = apiMap.get(dateStr);

    cells.push({
      date: dateStr,
      day,
      isCurrentMonth,
      status: apiData?.status ?? 'empty',
      dueCount: apiData?.dueCount ?? 0,
      reviewedCount: apiData?.reviewedCount ?? 0,
    });
  }

  return cells;
});

/* ================= Tooltip ================= */

function getDayTooltip(day: CalendarDay & { isCurrentMonth: boolean }) {
  if (!day.isCurrentMonth) return '';

  const map = {
    empty: t('review.calendar.empty'),
    pending: t('review.calendar.pending'),
    incomplete: t('review.calendar.incomplete'),
    completed: t('review.calendar.completed'),
  };

  let text = map[day.status];
  if (day.dueCount || day.reviewedCount) {
    text += ` (${day.reviewedCount}/${day.dueCount})`;
  }
  return text;
}

/* ================= API ================= */

async function loadCalendarData() {
  try {
    const res = await window.ipc.review.getCalendar(
      currentYear.value,
      currentMonth.value
    );
    calendarDays.value = res?.success ? res.data ?? [] : [];
  } catch {
    calendarDays.value = [];
  }
}

/* ================= 月份切换 ================= */

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

watch([currentYear, currentMonth], loadCalendarData);
onMounted(loadCalendarData);

defineExpose({ refresh: loadCalendarData });
</script>

<style scoped>
.review-calendar {
  background: var(--color-background-secondary);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

/* 日历头部 */
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.nav-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.2s;
}

.nav-btn:hover {
  background: var(--color-background-hover);
  border-color: var(--color-primary);
}

.arrow {
  font-size: 18px;
  line-height: 1;
}

.month-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

/* 星期行 */
.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.weekday {
  text-align: center;
  font-size: 10px;
  color: var(--color-text-secondary);
  padding: 4px 0;
}

/* 日历网格 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-cell {
  position: relative;
  width: 100%;
  min-height: 28px;
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: default;
  transition: all 0.15s;
  background: var(--color-background);
}

.day-cell:not(.empty):not(.today):hover {
  background: var(--color-background-tertiary);
}

.day-cell.other {
  opacity: 0.35;
  pointer-events: none;
}

.day-number {
  font-size: 11px;
  color: var(--color-text);
}

.day-cell.today {
  background: var(--color-primary);
}

.day-cell.today .day-number {
  color: white;
  font-weight: 600;
}

/* 状态圆点 */
.day-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  margin-top: 2px;
}

/* 状态颜色 */
.day-cell.pending .day-dot {
  background: #3b82f6; /* 蓝色 - 待复习计划 */
}

.day-cell.incomplete .day-dot {
  background: #ef4444; /* 红色 - 未完成 */
}

.day-cell.completed .day-dot {
  background: #22c55e; /* 绿色 - 已完成 */
}

.day-cell.today.pending .day-dot,
.day-cell.today.incomplete .day-dot,
.day-cell.today.completed .day-dot {
  background: white;
  box-shadow: 0 0 0 2px currentColor;
}

.day-cell.today.pending .day-dot {
  box-shadow: 0 0 0 2px #3b82f6;
}

.day-cell.today.incomplete .day-dot {
  box-shadow: 0 0 0 2px #ef4444;
}

.day-cell.today.completed .day-dot {
  box-shadow: 0 0 0 2px #22c55e;
}

/* 图例 */
.legend {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.pending {
  background: #3b82f6;
}

.legend-dot.incomplete {
  background: #ef4444;
}

.legend-dot.completed {
  background: #22c55e;
}
</style>