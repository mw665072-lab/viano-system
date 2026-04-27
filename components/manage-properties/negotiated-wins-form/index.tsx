"use client";

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NegotiatedWin {
  item: string;
  value: string;
  category?: 'new_major_update' | 'repairs_made' | 'seller_credit';
  system_type?: 'hvac' | 'roof_shingle' | 'roof_tile_metal' | 'water_heater' | 'water_heater_tankless' | 'pool_equipment' | 'electrical' | 'plumbing' | 'appliances';
  unit_name?: string;
  notes?: string;
}

interface NegotiatedWinsFormProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select Category' },
  { value: 'new_major_update', label: 'Major/New Update' },
  { value: 'repairs_made', label: 'Repairs Made' },
  { value: 'seller_credit', label: 'Seller Credit' },
];

const SYSTEM_TYPE_OPTIONS = [
  { value: '', label: 'Select System Type' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'roof_shingle', label: 'Roof (Shingle)' },
  { value: 'roof_tile_metal', label: 'Roof (Tile/Metal)' },
  { value: 'water_heater', label: 'Water Heater (Tank)' },
  { value: 'water_heater_tankless', label: 'Water Heater (Tankless)' },
  { value: 'pool_equipment', label: 'Pool Equipment' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'appliances', label: 'Appliances' },
];

const NegotiatedWinsForm: React.FC<NegotiatedWinsFormProps> = ({ value, onChange, disabled = false }) => {
  const [wins, setWins] = useState<NegotiatedWin[]>(() => {
    // Parse existing value if it's a JSON string
    if (value && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((win: any) => ({
            item: win.item || '',
            value: win.value || '',
            category: win.category || undefined,
            system_type: win.system_type || undefined,
            unit_name: win.unit_name || undefined,
            notes: win.notes || '',
          }));
        }
      } catch (e) {
        // If parsing fails, treat as plain text
        return [{ item: value, value: '', category: undefined, system_type: undefined, unit_name: undefined, notes: '' }];
      }
    }
    return [];
  });

  const handleAddWin = () => {
    setWins([...wins, { item: '', value: '', category: undefined, system_type: undefined, unit_name: undefined, notes: '' }]);
  };

  const handleRemoveWin = (index: number) => {
    const newWins = wins.filter((_, i) => i !== index);
    setWins(newWins);
    updateParentValue(newWins);
  };

  const handleWinChange = (index: number, field: keyof NegotiatedWin, fieldValue: string) => {
    const newWins = [...wins];
    newWins[index] = { ...newWins[index], [field]: fieldValue };
    
    // If category is not "new_major_update", clear system_type and unit_name
    if (field === 'category' && fieldValue !== 'new_major_update') {
      newWins[index].system_type = undefined;
      newWins[index].unit_name = undefined;
    }
    
    // If system_type changes to something other than hvac or water_heater, clear unit_name
    if (field === 'system_type' && fieldValue !== 'hvac' && fieldValue !== 'water_heater') {
      newWins[index].unit_name = undefined;
    }
    
    setWins(newWins);
    updateParentValue(newWins);
  };

  const updateParentValue = (winsToUpdate: NegotiatedWin[]) => {
    if (winsToUpdate.length === 0) {
      onChange('');
      return;
    }

    // Filter out empty wins and serialize to JSON
    const validWins = winsToUpdate.filter(win => win.item.trim() || win.value.trim());
    
    if (validWins.length === 0) {
      onChange('');
      return;
    }

    // Convert to the format expected by the API
    const apiWins = validWins.map(win => ({
      item: win.item.trim(),
      value: win.value.trim(),
      ...(win.category && { category: win.category }),
      ...(win.system_type && { system_type: win.system_type }),
      ...(win.unit_name && { unit_name: win.unit_name }),
      ...(win.notes && win.notes.trim() && { notes: win.notes.trim() }),
    }));

    onChange(JSON.stringify(apiWins));
  };

  return (
    <div className="space-y-4">
      {wins.map((win, index) => (
        <div key={index} className="p-4 border border-[#D9D9D9] rounded-[8px] bg-white space-y-3">
          {/* Row 1: Item and Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Win Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., New HVAC installed"
                value={win.item}
                onChange={(e) => handleWinChange(index, 'item', e.target.value)}
                disabled={disabled}
                className="w-full h-[40px] rounded-[6px] border border-[#D9D9D9] bg-white px-3 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00346C] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Value
              </label>
              <input
                type="text"
                placeholder="e.g., $8,500"
                value={win.value}
                onChange={(e) => handleWinChange(index, 'value', e.target.value)}
                disabled={disabled}
                className="w-full h-[40px] rounded-[6px] border border-[#D9D9D9] bg-white px-3 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00346C] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Row 2: Category and System Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Category
              </label>
              <select
                value={win.category || ''}
                onChange={(e) => handleWinChange(index, 'category', e.target.value)}
                disabled={disabled}
                className="w-full h-[40px] rounded-[6px] border border-[#D9D9D9] bg-white px-3 text-sm text-[#1E1E1E] focus:outline-none focus:ring-1 focus:ring-[#00346C] disabled:opacity-50"
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                System Type
              </label>
              <select
                value={win.system_type || ''}
                onChange={(e) => handleWinChange(index, 'system_type', e.target.value)}
                disabled={disabled || win.category !== 'new_major_update'}
                className="w-full h-[40px] rounded-[6px] border border-[#D9D9D9] bg-white px-3 text-sm text-[#1E1E1E] focus:outline-none focus:ring-1 focus:ring-[#00346C] disabled:opacity-50"
              >
                {SYSTEM_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {win.category !== 'new_major_update' && (
                <p className="text-xs text-[#9CA3AF] mt-1">Only available for "Major/New Update"</p>
              )}
            </div>
          </div>

          {/* Row 2.5: Unit Name (conditional - only for HVAC and Water Heater Tank) */}
          {win.category === 'new_major_update' &&
           (win.system_type === 'hvac' || win.system_type === 'water_heater') && (
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Unit Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Unit 1, Unit 2 (leave empty for all units)"
                value={win.unit_name || ''}
                onChange={(e) => handleWinChange(index, 'unit_name', e.target.value)}
                disabled={disabled}
                className="w-full h-[40px] rounded-[6px] border border-[#D9D9D9] bg-white px-3 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00346C] disabled:opacity-50"
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Leave empty to reset all units of this type</p>
            </div>
          )}

          {/* Row 3: Notes */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">
              Notes
            </label>
            <textarea
              placeholder="Add any additional context..."
              value={win.notes || ''}
              onChange={(e) => handleWinChange(index, 'notes', e.target.value)}
              disabled={disabled}
              className="w-full min-h-[60px] rounded-[6px] border border-[#D9D9D9] bg-white px-3 py-2 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00346C] disabled:opacity-50"
            />
          </div>

          {/* Remove Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleRemoveWin(index)}
              disabled={disabled}
              className="text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Add Win Button */}
      <Button
        type="button"
        onClick={handleAddWin}
        disabled={disabled}
        className="w-full h-[40px] rounded-[8px] border-2 border-dashed border-[#00346C] bg-white hover:bg-[#F8FAFC] text-[#00346C] text-sm font-medium disabled:opacity-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Negotiated Win
      </Button>

      {wins.length === 0 && (
        <p className="text-xs text-[#9CA3AF] text-center">No negotiated wins added yet. Click the button above to add one.</p>
      )}
    </div>
  );
};

export default NegotiatedWinsForm;
