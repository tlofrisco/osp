<!-- 📅 Calendar View Component -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  export let entityName: string = '';
  
  // Calendar state
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let selectedDate: Date | null = null;
  
  // Data
  let events: any[] = [];
  let loading = true;
  
  // Calendar grid
  let calendarDays: (Date | null)[] = [];
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  onMount(async () => {
    await loadEvents();
    generateCalendarDays();
  });
  
  async function loadEvents() {
    try {
      // Load events/reservations from the database
      const response = await fetch(`/api/data/${serviceSchema}/${entityName}`);
      if (response.ok) {
        const data = await response.json();
        events = data.items || [];
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      loading = false;
    }
  }
  
  function generateCalendarDays() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    calendarDays = [];
    const date = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      if (date.getMonth() === currentMonth) {
        calendarDays.push(new Date(date));
      } else {
        calendarDays.push(null);
      }
      date.setDate(date.getDate() + 1);
    }
  }
  
  function previousMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    generateCalendarDays();
  }
  
  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    generateCalendarDays();
  }
  
  function selectDate(date: Date | null) {
    if (date) {
      selectedDate = date;
    }
  }
  
  function getEventsForDate(date: Date): any[] {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.date || event.datetime || event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  }
  
  function getDateClass(date: Date | null): string {
    if (!date) return 'empty';
    
    const classes = ['calendar-day'];
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      classes.push('today');
    }
    
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
      classes.push('selected');
    }
    
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
      classes.push('has-events');
      if (dayEvents.length >= 5) {
        classes.push('busy');
      }
    }
    
    return classes.join(' ');
  }
  
  function formatTime(datetime: string): string {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
</script>

<div class="calendar-container">
  <div class="calendar-header">
    <h3>{metadata.title || 'Calendar View'}</h3>
    <div class="calendar-controls">
      <button class="nav-button" on:click={previousMonth}>
        ←
      </button>
      <span class="current-month">
        {monthNames[currentMonth]} {currentYear}
      </span>
      <button class="nav-button" on:click={nextMonth}>
        →
      </button>
    </div>
  </div>
  
  <div class="calendar-grid">
    <div class="day-headers">
      {#each dayNames as day}
        <div class="day-header">{day}</div>
      {/each}
    </div>
    
    <div class="calendar-days">
      {#each calendarDays as date, i}
        <button
          class={getDateClass(date)}
          on:click={() => selectDate(date)}
          disabled={!date}
        >
          {#if date}
            <span class="date-number">{date.getDate()}</span>
            {#if getEventsForDate(date).length > 0}
              <div class="event-indicators">
                {#each getEventsForDate(date).slice(0, 3) as event}
                  <div class="event-dot" title={event.name || event.title}></div>
                {/each}
                {#if getEventsForDate(date).length > 3}
                  <span class="more-events">+{getEventsForDate(date).length - 3}</span>
                {/if}
              </div>
            {/if}
          {/if}
        </button>
      {/each}
    </div>
  </div>
  
  {#if selectedDate}
    <div class="selected-date-details">
      <h4>
        {selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </h4>
      
      <div class="events-list">
        {#if getEventsForDate(selectedDate).length > 0}
          <h5>Events & Reservations</h5>
          {#each getEventsForDate(selectedDate) as event}
            <div class="event-item">
              <span class="event-time">
                {formatTime(event.date || event.datetime || event.start_time)}
              </span>
              <span class="event-name">
                {event.name || event.customer_name || event.title || 'Reservation'}
              </span>
              {#if event.party_size}
                <span class="event-detail">Party of {event.party_size}</span>
              {/if}
              {#if event.table_number}
                <span class="event-detail">Table {event.table_number}</span>
              {/if}
            </div>
          {/each}
        {:else}
          <p class="no-events">No events scheduled</p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .calendar-container {
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }
  
  .calendar-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .calendar-header h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .calendar-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .nav-button {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    font-size: 1rem;
    color: #374151;
    transition: all 0.2s;
  }
  
  .nav-button:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
  
  .current-month {
    font-weight: 600;
    color: #1f2937;
    min-width: 150px;
    text-align: center;
  }
  
  .calendar-grid {
    padding: 1rem;
  }
  
  .day-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .day-header {
    text-align: center;
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    padding: 0.5rem;
  }
  
  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }
  
  .calendar-day {
    aspect-ratio: 1;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  
  .calendar-day:hover:not(.empty) {
    background: #f9fafb;
    border-color: #d1d5db;
  }
  
  .calendar-day.empty {
    visibility: hidden;
  }
  
  .calendar-day.today {
    background: #eff6ff;
    border-color: #3b82f6;
  }
  
  .calendar-day.selected {
    background: #3b82f6;
    color: white;
    border-color: #2563eb;
  }
  
  .calendar-day.has-events {
    font-weight: 600;
  }
  
  .calendar-day.busy {
    background: #fef2f2;
    border-color: #fecaca;
  }
  
  .date-number {
    font-size: 0.875rem;
  }
  
  .event-indicators {
    display: flex;
    gap: 2px;
    margin-top: 4px;
    align-items: center;
  }
  
  .event-dot {
    width: 6px;
    height: 6px;
    background: #3b82f6;
    border-radius: 50%;
  }
  
  .calendar-day.selected .event-dot {
    background: white;
  }
  
  .more-events {
    font-size: 0.625rem;
    color: #6b7280;
  }
  
  .selected-date-details {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .selected-date-details h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .events-list h5 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }
  
  .event-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }
  
  .event-time {
    font-size: 0.875rem;
    font-weight: 600;
    color: #3b82f6;
    min-width: 80px;
  }
  
  .event-name {
    flex: 1;
    font-size: 0.875rem;
    color: #1f2937;
  }
  
  .event-detail {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .no-events {
    text-align: center;
    color: #6b7280;
    font-size: 0.875rem;
    padding: 1rem;
  }
</style> 