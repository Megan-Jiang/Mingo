import React from 'react';
import { Calendar, Tag } from 'lucide-react';

const PersonCard = ({ person, onClick }) => {
  return (
    <div 
      onClick={() => onClick(person)}
      className="bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border border-[#e7e3b3]"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-[#fcd753] rounded-full flex items-center justify-center shadow-md">
          <img 
            src={`https://nocode.meituan.com/photo/search?keyword=person&width=64&height=64`}
            alt={person.name}
            className="w-14 h-14 rounded-full mx-auto object-cover"
          />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg">{person.name}</h3>
          {person.alias && (
            <p className="text-sm text-[#897dbf] mb-1">{person.alias}</p>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Calendar className="h-4 w-4 text-[#897dbf]" />
            <span>最近互动: {person.lastInteraction}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <div className="flex gap-1">
              {person.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-[#d6b7d6] text-[#897dbf] text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {person.tags.length > 3 && (
                <span className="px-2 py-1 bg-[#d6b7d6] text-[#897dbf] text-xs rounded-full">
                  +{person.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonCard;
