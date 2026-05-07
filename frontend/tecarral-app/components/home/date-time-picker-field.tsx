import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { MONTH_NAMES, WEEKDAY_NAMES } from '@/constants/home';
import { AppColors } from '@/constants/theme';
import { homeStyles } from '@/styles/home.styles';
import {
  buildMonthDays,
  formatProposalDate,
  parseProposalDateValue,
  toIsoLocalString,
} from '@/utils/home-format';

export function DateTimePickerField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (nextValue: string) => void;
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(() => parseProposalDateValue(value));

  useEffect(() => {
    if (!modalVisible) {
      setDraftDate(parseProposalDateValue(value));
    }
  }, [modalVisible, value]);

  const monthDays = useMemo(() => buildMonthDays(draftDate), [draftDate]);
  const selectedMonth = draftDate.getMonth();
  const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
  const minuteOptions = ['00', '15', '30', '45'];

  function changeMonth(offset: number) {
    setDraftDate((current) => {
      return new Date(
        current.getFullYear(),
        current.getMonth() + offset,
        current.getDate(),
        current.getHours(),
        current.getMinutes()
      );
    });
  }

  function applyDay(day: Date) {
    setDraftDate((current) => {
      const next = new Date(current);
      next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
      return next;
    });
  }

  function applyHour(hour: string) {
    setDraftDate((current) => {
      const next = new Date(current);
      next.setHours(Number(hour));
      return next;
    });
  }

  function applyMinute(minute: string) {
    setDraftDate((current) => {
      const next = new Date(current);
      next.setMinutes(Number(minute));
      return next;
    });
  }

  return (
    <View style={homeStyles.dateFieldBlock}>
      <Text style={homeStyles.formFieldLabel}>{label}</Text>
      <Pressable onPress={() => setModalVisible(true)} style={homeStyles.formInputButton}>
        <Text style={[homeStyles.formInputButtonText, !value && homeStyles.formInputPlaceholder]}>
          {value ? formatProposalDate(value) : placeholder}
        </Text>
        <Ionicons color={AppColors.primary} name="calendar-outline" size={20} />
      </Pressable>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={homeStyles.modalOverlay}>
          <View style={homeStyles.datePickerCard}>
            <View style={homeStyles.datePickerHeader}>
              <Text style={homeStyles.datePickerTitle}>{label}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons color={AppColors.primary} name="close-circle-outline" size={24} />
              </Pressable>
            </View>

            <View style={homeStyles.datePickerMonthRow}>
              <Pressable onPress={() => changeMonth(-1)} style={homeStyles.datePickerMonthButton}>
                <Ionicons color={AppColors.primary} name="chevron-back" size={18} />
              </Pressable>
              <Text style={homeStyles.datePickerMonthLabel}>
                {MONTH_NAMES[draftDate.getMonth()]} {draftDate.getFullYear()}
              </Text>
              <Pressable onPress={() => changeMonth(1)} style={homeStyles.datePickerMonthButton}>
                <Ionicons color={AppColors.primary} name="chevron-forward" size={18} />
              </Pressable>
            </View>

            <View style={homeStyles.calendarWeekHeader}>
              {WEEKDAY_NAMES.map((weekday) => (
                <Text key={weekday} style={homeStyles.calendarWeekday}>
                  {weekday}
                </Text>
              ))}
            </View>

            <View style={homeStyles.calendarGrid}>
              {monthDays.map((day) => {
                const isCurrentMonth = day.getMonth() === selectedMonth;
                const isSelected =
                  day.getDate() === draftDate.getDate() &&
                  day.getMonth() === draftDate.getMonth() &&
                  day.getFullYear() === draftDate.getFullYear();

                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => applyDay(day)}
                    style={[
                      homeStyles.calendarDay,
                      isSelected && homeStyles.calendarDaySelected,
                    ]}>
                    <Text
                      style={[
                        homeStyles.calendarDayText,
                        !isCurrentMonth && homeStyles.calendarDayTextMuted,
                        isSelected && homeStyles.calendarDayTextSelected,
                      ]}>
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={homeStyles.datePickerSectionTitle}>Hora</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={homeStyles.timePickerRow}>
              {hourOptions.map((hour) => {
                const active = draftDate.getHours() === Number(hour);
                return (
                  <Pressable
                    key={hour}
                    onPress={() => applyHour(hour)}
                    style={[homeStyles.timeChip, active && homeStyles.timeChipActive]}>
                    <Text style={[homeStyles.timeChipText, active && homeStyles.timeChipTextActive]}>
                      {hour}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={homeStyles.datePickerSectionTitle}>Minutos</Text>
            <View style={homeStyles.timePickerWrap}>
              {minuteOptions.map((minute) => {
                const active = draftDate.getMinutes() === Number(minute);
                return (
                  <Pressable
                    key={minute}
                    onPress={() => applyMinute(minute)}
                    style={[homeStyles.timeChip, active && homeStyles.timeChipActive]}>
                    <Text style={[homeStyles.timeChipText, active && homeStyles.timeChipTextActive]}>
                      {minute}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={homeStyles.datePickerFooter}>
              <Pressable onPress={() => setModalVisible(false)} style={homeStyles.datePickerSecondaryButton}>
                <Text style={homeStyles.datePickerSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(toIsoLocalString(draftDate));
                  setModalVisible(false);
                }}
                style={homeStyles.datePickerPrimaryButton}>
                <Text style={homeStyles.datePickerPrimaryText}>Aplicar</Text>
              </Pressable>
            </View>

            <Text style={homeStyles.datePickerPreview}>
              Seleccionado: {formatProposalDate(toIsoLocalString(draftDate))}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
