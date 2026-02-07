import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [selectedDate, setSelectedDate] = useState(null);

  // 模拟记录数据
  const records = {
    '2024-01-15': [
      { id: 1, person: '小明', tag: '工作', color: 'bg-blue-200' },
      { id: 2, person: '妈妈', tag: '陪伴', color: 'bg-pink-200' }
    ],
    '2024-01-10': [
      { id: 3, person: '小红', tag: '复合价值', color: 'bg-yellow-200' }
    ],
    '2024-01-05': [
      { id: 4, person: '老王', tag: '工作', color: 'bg-blue-200' }
    ]
  };

  // 获取当月天数
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    return { daysInMonth, startDay };
  };

  // 生成日历天数
  const generateCalendarDays = () => {
    const { daysInMonth, startDay } = getDaysInMonth(currentDate);
    const days = [];
    
    // 添加上个月的天数填充
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthDays = getDaysInMonth(prevMonth).daysInMonth;
    
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthDays - i)
      });
    }
    
    // 添加当月的天数
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
      });
    }
    
    // 添加下个月的天数填充
    const totalCells = 42; // 6 rows * 7 days
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    for (let i = 1; days.length < totalCells; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i)
      });
    }
    
    return days;
  };

  // 格式化日期为字符串
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 获取日期的记录
  const getRecordsForDate = (date) => {
    const dateStr = formatDate(date);
    return records[dateStr] || [];
  };

  // 导航到上一个月/周/日
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  // 导航到下一个月/周/日
  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // 处理日期点击
  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  // 渲染月视图
  const renderMonthView = () => {
    const days = generateCalendarDays();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayRecords = getRecordsForDate(day.date);
            const isToday = formatDate(day.date) === formatDate(new Date());
            const isSelected = selectedDate && formatDate(day.date) === formatDate(selectedDate);
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(day.date)}
                className={`
                  relative h-24 p-1 border rounded-lg cursor-pointer transition-colors
                  ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                  ${isToday ? 'border-[#fcd753] border-2' : 'border-gray-200'}
                  ${isSelected ? 'bg-[#e7e3b3]' : ''}
                  hover:bg-[#e7e3b3]
                `}
              >
                <div className={`text-right p-1 ${isToday ? 'font-bold text-[#fcd753]' : ''}`}>
                  {day.day}
                </div>
                
                {/* 记录指示器 */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {dayRecords.slice(0, 3).map((record, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full ${record.color}`}
                      title={`${record.person} - ${record.tag}`}
                    />
                  ))}
                  {dayRecords.length > 3 && (
                    <div className="w-3 h-3 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                      +{dayRecords.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 渲染选中的日期详情
  const renderDateDetails = () => {
    if (!selectedDate) return null;
    
    const dayRecords = getRecordsForDate(selectedDate);
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 记录
        </h3>
        
        {dayRecords.length > 0 ? (
          <div className="space-y-4">
            {dayRecords.map((record) => (
              <div key={record.id} className="flex items-center gap-4 p-3 bg-[#e7e3b3] rounded-lg">
                <div className={`w-10 h-10 rounded-full ${record.color} flex items-center justify-center`}>
                  <img 
                    src={`https://nocode.meituan.com/photo/search?keyword=person&width=40&height=40`}
                    alt={record.person}
                    className="w-8 h-8 rounded-full mx-auto object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{record.person}</p>
                  <p className="text-sm text-gray-600">{record.tag}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">当天没有记录</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background-custom p-4 pb-24">
      <div className="container mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-[#897dbf]" />
            日历
          </h1>
          
          {/* 视图切换 */}
          <div className="flex bg-white rounded-lg p-1 shadow-md">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-3 py-1 rounded-md text-sm font-medium transition-colors
                  ${viewMode === mode 
                    ? 'bg-[#fcd753] text-white' 
                    : 'text-gray-600 hover:bg-[#e7e3b3]'}
                `}
              >
                {mode === 'month' ? '月' : mode === 'week' ? '周' : '日'}
              </button>
            ))}
          </div>
        </div>

        {/* 导航 */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={navigatePrevious}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <h2 className="text-xl font-semibold text-gray-800">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h2>
          
          <button 
            onClick={navigateNext}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* 日历视图 */}
        {viewMode === 'month' && renderMonthView()}
        
        {/* 选中的日期详情 */}
        {renderDateDetails()}
        
        {/* 图例 */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">图例</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-200"></div>
              <span className="text-sm text-gray-600">工作</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-pink-200"></div>
              <span className="text-sm text-gray-600">陪伴</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-200"></div>
              <span className="text-sm text-gray-600">复合价值</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
