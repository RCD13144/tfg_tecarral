import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { machineImageMap, normalizeMachineImageKey } from '@/constants/machine-images';
import { AppColors } from '@/constants/theme';
import { ApiError } from '@/services/api';
import {
  getMachineDetail,
  getMachineSuggestions,
  getMaquinas,
  markMachineArrivedAtBase,
  markMachineDelivered,
  moveMachineBetweenBases,
  updateMachineMaintenanceStatus,
} from '@/services/maquinas-api';
import { createMachineProposal, getMachineProposals } from '@/services/propuestas-api';
import type {
  FilterCategoryKey,
  HomeSubview,
  HomeTabKey,
  MachineDetail,
  MachineFilters,
  MachineProposalSummary,
  Maquina,
  ProposalFormData,
  SearchSuggestion,
} from '@/types/maquina';

const LOGIN_ROUTE = '/login' as never;
const TAB_BAR_HORIZONTAL_PADDING = 22;
const TAB_BAR_INNER_PADDING = 8;
const TAB_ICON_SIZE = 30;
const TAB_KEYS: HomeTabKey[] = ['home', 'albaran', 'reparacion', 'user'];

const FILTER_DEFINITIONS: {
  key: FilterCategoryKey;
  label: string;
  options: { label: string; value: string }[];
}[] = [
  {
    key: 'availability',
    label: 'Disponibilidad',
    options: [
      { label: 'Alquilada', value: 'ALQUILADA' },
      { label: 'Disponible', value: 'DISPONIBLE' },
      { label: 'Solicitada', value: 'SOLICITADA' },
    ],
  },
  {
    key: 'tipo',
    label: 'Tipo',
    options: [
      { label: 'Elevacion', value: 'elevacion' },
      { label: 'Limpieza', value: 'limpieza' },
    ],
  },
  {
    key: 'subtipo',
    label: 'Subtipo',
    options: [
      { label: 'Carretillas elevadoras', value: 'Carretilla elevad.' },
      { label: 'Retractiles', value: 'Retractil' },
      { label: 'Plataformas de tijera', value: 'Plataforma tijera' },
      { label: 'Barredoras', value: 'Barredora' },
      { label: 'Plataformas articuladas', value: 'Plataforma artic.' },
      { label: 'Fregadoras', value: 'Fregadora' },
      { label: 'Transpaletas electricas', value: 'Transpaleta electrica' },
      { label: 'Preparapedidos', value: 'Preparapedidos' },
      { label: 'Transpaletas manuales', value: 'Transpaleta manual' },
      { label: 'Criogenas', value: 'Criogena' },
      { label: 'Limpia-moquetas', value: 'Limpiamoquetas' },
      { label: 'Hidrolimpiadoras', value: 'Hidrolimpiadora' },
      { label: 'Apiladores', value: 'Apilador' },
      { label: 'Vaporetas', value: 'Vaporeta' },
      { label: 'Pulidoras', value: 'Pulidora' },
      { label: 'Aspiradores', value: 'Aspirador' },
    ],
  },
  {
    key: 'motor',
    label: 'Combustion',
    options: [
      { label: 'Diesel', value: 'diesel' },
      { label: 'Electricas', value: 'electrica' },
      { label: 'Semi electricas', value: 'semi electrica' },
      { label: 'Manuales', value: 'manual' },
    ],
  },
  {
    key: 'ubicacion_type',
    label: 'Ubicacion',
    options: [
      { label: 'Taller', value: 'TALLER' },
      { label: 'Cliente', value: 'CLIENTE' },
      { label: 'Almacen', value: 'ALMACEN' },
      { label: 'Transito', value: 'TRANSITO' },
    ],
  },
];

const EMPTY_FILTERS: MachineFilters = {
  availability: [],
  tipo: [],
  subtipo: [],
  motor: [],
  ubicacion_type: [],
};

const EMPTY_PROPOSAL_FORM: ProposalFormData = {
  cliente: '',
  email_cliente: '',
  telefono: '',
  direccion: '',
  cp: '',
  poblacion: '',
  precio: '',
  fecha_inicio: '',
  fecha_fin: '',
};

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const COMMON_DETAIL_FIELDS: { label: string; key: keyof MachineDetail }[] = [
  { label: 'Marca', key: 'marca' },
  { label: 'Modelo', key: 'modelo' },
  { label: 'Direccion', key: 'ubicacion' },
  { label: 'Disponibilidad', key: 'availability_status' },
  { label: 'Tipo', key: 'tipo_maquina' },
  { label: 'No de serie', key: 'ns' },
  { label: 'No Poliza', key: 'num_poliza' },
];

const ELEVATION_DETAIL_FIELDS: { label: string; key: keyof MachineDetail }[] = [
  { label: 'Ruedas', key: 'elev_ruedas' },
  { label: 'Capacidad de carga', key: 'elev_cap_carga' },
  { label: 'Replegado', key: 'elev_replegado_mm' },
  { label: 'Elevacion libre', key: 'elev_elevacion_libre' },
  { label: 'Elevacion', key: 'elev_elevacion' },
  { label: 'Desplazamiento', key: 'elev_desplazamiento' },
  { label: 'Posicion', key: 'elev_posicion' },
  { label: 'Antihuella', key: 'elev_antihuella' },
  { label: 'Matricula', key: 'elev_matricula' },
  { label: 'Largo', key: 'elev_largo' },
  { label: 'Alto', key: 'elev_alto' },
  { label: 'Ancho', key: 'elev_ancho' },
  { label: 'Peso', key: 'elev_peso_kg' },
  { label: 'Horquillas', key: 'elev_horquillas' },
];

function normalizeValue(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function stripAccents(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatMachineName(machine: Maquina) {
  const subtipo = stripAccents(machine.tipo).trim();
  const tipo = stripAccents(machine.tipo_maquina).trim();

  if (subtipo.length > 0) {
    return subtipo;
  }

  if (tipo.length > 0) {
    return tipo;
  }

  return `Maquina ${machine.id_maquina}`;
}

function getMachineImageSource(machine: Pick<Maquina, 'modelo'>) {
  const key = normalizeMachineImageKey(machine.modelo);
  const imagesByKey = machineImageMap as Record<string, unknown>;

  if (key.length === 0) {
    return null;
  }

  return imagesByKey[key] ?? null;
}

function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Si' : 'No';
  }

  const text = stripAccents(value).trim();
  return text.length > 0 ? text : '-';
}

function formatLocationLabel(value: unknown) {
  const key = stripAccents(value).trim().toUpperCase();

  if (key === 'TALLER') return 'Taller';
  if (key === 'ALMACEN') return 'Almacen';
  if (key === 'CLIENTE') return 'Cliente';
  if (key === 'TRANSITO') return 'Transito';
  return formatDisplayValue(value);
}

function formatMaintenanceLabel(value: unknown) {
  const key = stripAccents(value).trim().toUpperCase();

  if (key === 'OK') return 'OK';
  if (key === 'AVERIADA') return 'Averiada';
  if (key === 'AVERIADA_GRAVE') return 'Averiada grave';
  return formatDisplayValue(value);
}

function machineMatchesFilters(machine: Maquina, filters: MachineFilters) {
  const availabilityValue = String(machine.availability_status ?? '').trim().toUpperCase();
  const tipoValue = normalizeValue(machine.tipo_maquina);
  const subtipoValue = normalizeValue(machine.tipo);
  const motorValue = normalizeValue(machine.motor);
  const ubicacionValue = String(machine.ubicacion_tipo ?? '').trim().toUpperCase();

  const matchesAvailability =
    filters.availability.length === 0 || filters.availability.includes(availabilityValue);
  const matchesTipo =
    filters.tipo.length === 0 ||
    filters.tipo.some((value) => normalizeValue(value) === tipoValue);
  const matchesSubtipo =
    filters.subtipo.length === 0 ||
    filters.subtipo.some((value) => normalizeValue(value) === subtipoValue);
  const matchesMotor =
    filters.motor.length === 0 ||
    filters.motor.some((value) => normalizeValue(value) === motorValue);
  const matchesUbicacion =
    filters.ubicacion_type.length === 0 || filters.ubicacion_type.includes(ubicacionValue);

  return (
    matchesAvailability &&
    matchesTipo &&
    matchesSubtipo &&
    matchesMotor &&
    matchesUbicacion
  );
}

function getAllowedMaintenanceOptions(currentStatus: unknown) {
  const current = String(currentStatus ?? '').trim().toUpperCase();

  if (current === 'OK') {
    return [
      { label: 'OK', value: 'OK' },
      { label: 'Averiada', value: 'AVERIADA' },
      { label: 'Averiada grave', value: 'AVERIADA_GRAVE' },
    ];
  }

  if (current === 'AVERIADA') {
    return [
      { label: 'Averiada', value: 'AVERIADA' },
      { label: 'Averiada grave', value: 'AVERIADA_GRAVE' },
    ];
  }

  return [{ label: formatMaintenanceLabel(currentStatus), value: current || 'AVERIADA_GRAVE' }];
}

function getLocationOptions(detail: MachineDetail | null) {
  if (!detail) {
    return [];
  }

  const current = stripAccents(detail.ubicacion_tipo).trim().toUpperCase();
  const rawOptions = [current, 'TALLER', 'ALMACEN', 'CLIENTE'];

  return Array.from(new Set(rawOptions.filter((item) => item.length > 0))).map((value) => ({
    label: formatLocationLabel(value),
    value,
  }));
}

function formatProposalDate(value: unknown) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return '-';
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildMonthDays(date: Date) {
  const firstDay = startOfMonth(date);
  const jsWeekday = firstDay.getDay();
  const mondayBasedOffset = (jsWeekday + 6) % 7;
  const firstVisibleDay = new Date(firstDay);
  firstVisibleDay.setDate(firstVisibleDay.getDate() - mondayBasedOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(firstVisibleDay);
    next.setDate(firstVisibleDay.getDate() + index);
    return next;
  });
}

function toIsoLocalString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

function parseProposalDateValue(value: string) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <Text style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}: </Text>
      <Text style={styles.detailValue}>{formatDisplayValue(value)}</Text>
    </Text>
  );
}

function SelectorField({
  label,
  valueLabel,
  options,
  isOpen,
  onToggleOpen,
  onSelect,
  disabled = false,
}: {
  label: string;
  valueLabel: string;
  options: { label: string; value: string }[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.selectorBlock}>
      <Text style={styles.detailLine}>
        <Text style={styles.detailLabel}>{label}: </Text>
      </Text>
      <Pressable
        disabled={disabled}
        onPress={onToggleOpen}
        style={[styles.selectorButton, disabled && styles.selectorButtonDisabled]}>
        <Text style={styles.selectorButtonText}>{valueLabel}</Text>
        <Ionicons
          color={AppColors.primary}
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.selectorList}>
          {options.map((option) => (
            <Pressable
              key={`${label}:${option.value}`}
              onPress={() => onSelect(option.value)}
              style={styles.selectorListItem}>
              <Text style={styles.selectorListItemText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MachineCard({
  item,
  width,
  onPress,
}: {
  item: Maquina;
  width: number;
  onPress: () => void;
}) {
  const imageSource = getMachineImageSource(item);

  return (
    <Pressable onPress={onPress} style={[styles.machineCard, { width }]}>
      <View style={styles.machineMedia}>
        {imageSource ? (
          <ExpoImage contentFit="contain" source={imageSource} style={styles.machineImage} />
        ) : (
          <Ionicons color={AppColors.primary50} name="image-outline" size={34} />
        )}
      </View>
      <View style={styles.machineInfo}>
        <Text numberOfLines={2} style={styles.machineLine}>
          <Text style={styles.machineLabel}>Nombre: </Text>
          {formatMachineName(item)}
        </Text>
        <Text numberOfLines={1} style={styles.machineLine}>
          <Text style={styles.machineLabel}>Marca: </Text>
          {String(item.marca ?? '-')}
        </Text>
        <Text numberOfLines={1} style={styles.machineLine}>
          <Text style={styles.machineLabel}>Ubicacion: </Text>
          {String(item.ubicacion_tipo ?? '-')}
        </Text>
        <Text numberOfLines={1} style={styles.machineLine}>
          <Text style={styles.machineLabel}>Modelo: </Text>
          {String(item.modelo ?? '-')}
        </Text>
      </View>
    </Pressable>
  );
}

function FilterPanel({
  filters,
  onClose,
  onToggle,
}: {
  filters: MachineFilters;
  onClose: () => void;
  onToggle: (category: FilterCategoryKey, value: string) => void;
}) {
  return (
    <View style={styles.filterPanelWrapper}>
      <View style={styles.filterPanel}>
        <Pressable style={styles.filterCloseButton} onPress={onClose}>
          <Ionicons color={AppColors.primary} name="close-circle-outline" size={24} />
        </Pressable>

        {FILTER_DEFINITIONS.map((section) => (
          <View key={section.key} style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>{section.label}</Text>
            <View style={styles.filterChipRow}>
              {section.options.map((option) => {
                const active = filters[section.key].includes(option.value);

                return (
                  <Pressable
                    key={`${section.key}:${option.value}`}
                    onPress={() => onToggle(section.key, option.value)}
                    style={[styles.filterChip, active && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function PlaceholderTab({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.placeholderContainer}>
      <Image
        resizeMode="contain"
        source={require('@/assets/images/tecarral-logo.jpg')}
        style={styles.placeholderLogo}
      />
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderText}>{subtitle}</Text>
    </View>
  );
}

function ProposalCard({ item }: { item: MachineProposalSummary }) {
  return (
    <View style={styles.proposalCard}>
      <Text style={styles.proposalCardTitle}>
        Propuesta #{item.id} - {item.estado}
      </Text>
      <Text style={styles.proposalCardLine}>Cliente: {item.cliente}</Text>
      <Text style={styles.proposalCardLine}>
        Destino: {item.direccion}, {item.poblacion}
      </Text>
      <Text style={styles.proposalCardLine}>Precio: {item.precio}</Text>
      <Text style={styles.proposalCardLine}>Inicio: {formatProposalDate(item.fecha_inicio)}</Text>
      <Text style={styles.proposalCardLine}>Fin: {formatProposalDate(item.fecha_fin)}</Text>
    </View>
  );
}

function DateTimePickerField({
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
    setDraftDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, current.getDate(), current.getHours(), current.getMinutes()));
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
    <View style={styles.dateFieldBlock}>
      <Text style={styles.formFieldLabel}>{label}</Text>
      <Pressable onPress={() => setModalVisible(true)} style={styles.formInputButton}>
        <Text style={[styles.formInputButtonText, !value && styles.formInputPlaceholder]}>
          {value ? formatProposalDate(value) : placeholder}
        </Text>
        <Ionicons color={AppColors.primary} name="calendar-outline" size={20} />
      </Pressable>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>{label}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons color={AppColors.primary} name="close-circle-outline" size={24} />
              </Pressable>
            </View>

            <View style={styles.datePickerMonthRow}>
              <Pressable onPress={() => changeMonth(-1)} style={styles.datePickerMonthButton}>
                <Ionicons color={AppColors.primary} name="chevron-back" size={18} />
              </Pressable>
              <Text style={styles.datePickerMonthLabel}>
                {MONTH_NAMES[draftDate.getMonth()]} {draftDate.getFullYear()}
              </Text>
              <Pressable onPress={() => changeMonth(1)} style={styles.datePickerMonthButton}>
                <Ionicons color={AppColors.primary} name="chevron-forward" size={18} />
              </Pressable>
            </View>

            <View style={styles.calendarWeekHeader}>
              {WEEKDAY_NAMES.map((weekday) => (
                <Text key={weekday} style={styles.calendarWeekday}>
                  {weekday}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
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
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                    ]}>
                    <Text
                      style={[
                        styles.calendarDayText,
                        !isCurrentMonth && styles.calendarDayTextMuted,
                        isSelected && styles.calendarDayTextSelected,
                      ]}>
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.datePickerSectionTitle}>Hora</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePickerRow}>
              {hourOptions.map((hour) => {
                const active = draftDate.getHours() === Number(hour);
                return (
                  <Pressable
                    key={hour}
                    onPress={() => applyHour(hour)}
                    style={[styles.timeChip, active && styles.timeChipActive]}>
                    <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                      {hour}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.datePickerSectionTitle}>Minutos</Text>
            <View style={styles.timePickerWrap}>
              {minuteOptions.map((minute) => {
                const active = draftDate.getMinutes() === Number(minute);
                return (
                  <Pressable
                    key={minute}
                    onPress={() => applyMinute(minute)}
                    style={[styles.timeChip, active && styles.timeChipActive]}>
                    <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                      {minute}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.datePickerFooter}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.datePickerSecondaryButton}>
                <Text style={styles.datePickerSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  onChange(toIsoLocalString(draftDate));
                  setModalVisible(false);
                }}
                style={styles.datePickerPrimaryButton}>
                <Text style={styles.datePickerPrimaryText}>Aplicar</Text>
              </Pressable>
            </View>

            <Text style={styles.datePickerPreview}>
              Seleccionado: {formatProposalDate(toIsoLocalString(draftDate))}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function HomeScreen() {
  const { isHydrating, session } = useAuth();
  const { width } = useWindowDimensions();
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<HomeTabKey>('home');
  const [homeSubview, setHomeSubview] = useState<HomeSubview>('list');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [filters, setFilters] = useState<MachineFilters>(EMPTY_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [machines, setMachines] = useState<Maquina[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedMachineDetail, setSelectedMachineDetail] = useState<MachineDetail | null>(null);
  const [selectedMachineProposals, setSelectedMachineProposals] = useState<MachineProposalSummary[]>(
    []
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFeedback, setDetailFeedback] = useState<string | null>(null);
  const [selectedTargetLocation, setSelectedTargetLocation] = useState<string>('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [proposalsExpanded, setProposalsExpanded] = useState(false);
  const [locationActionLoading, setLocationActionLoading] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [proposalForm, setProposalForm] = useState<ProposalFormData>(EMPTY_PROPOSAL_FORM);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalFeedback, setProposalFeedback] = useState<string | null>(null);
  const [navigationModalOpen, setNavigationModalOpen] = useState(false);
  const [availableNavigationApps, setAvailableNavigationApps] = useState<
    { key: 'waze' | 'google' | 'apple'; label: string; url: string }[]
  >([]);

  const tabBarWidth = Math.max(0, width - TAB_BAR_HORIZONTAL_PADDING * 2);
  const tabSlotWidth = (tabBarWidth - TAB_BAR_INNER_PADDING * 2) / TAB_KEYS.length;
  const indicatorWidth = Math.max(44, tabSlotWidth - 16);
  const cardWidth = (width - 32 * 2 - 12) / 2;

  const visibleMachines = useMemo(
    () => machines.filter((machine) => machineMatchesFilters(machine, filters)),
    [filters, machines]
  );

  const activeFilterCount = useMemo(
    () =>
      filters.availability.length +
      filters.tipo.length +
      filters.subtipo.length +
      filters.motor.length +
      filters.ubicacion_type.length,
    [filters]
  );

  const acceptedProposal = useMemo(
    () => selectedMachineProposals.find((proposal) => proposal.estado === 'ACEPTADA') ?? null,
    [selectedMachineProposals]
  );

  const machineImageSource = useMemo(
    () => (selectedMachineDetail ? getMachineImageSource(selectedMachineDetail) : null),
    [selectedMachineDetail]
  );

  const locationOptions = useMemo(
    () => getLocationOptions(selectedMachineDetail),
    [selectedMachineDetail]
  );

  const maintenanceOptions = useMemo(
    () => getAllowedMaintenanceOptions(selectedMachineDetail?.maintenance_status),
    [selectedMachineDetail?.maintenance_status]
  );

  const canCreateProposal = session?.user.role === 'admin';
  const canMarkDelivered = ['TALLER', 'ALMACEN', 'CLIENTE', 'TRANSITO'].includes(
    String(selectedMachineDetail?.ubicacion_tipo ?? '').trim().toUpperCase()
  );

  useEffect(() => {
    const index = TAB_KEYS.indexOf(activeTab);
    const translateX =
      TAB_BAR_INNER_PADDING + index * tabSlotWidth + (tabSlotWidth - indicatorWidth) / 2;

    Animated.spring(indicatorTranslateX, {
      toValue: translateX,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [activeTab, indicatorTranslateX, indicatorWidth, tabSlotWidth]);

  useEffect(() => {
    if (!session?.token || activeTab !== 'home' || homeSubview !== 'list') {
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const result = await getMachineSuggestions(query, session.token);
        setSuggestions(result);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [activeTab, homeSubview, query, session?.token]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setAppliedQuery(query.trim());
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    let ignore = false;

    async function loadMachines() {
      try {
        setLoadingMachines(true);
        setFeedback(null);

        const result = await getMaquinas({
          q: appliedQuery.length > 0 ? appliedQuery : undefined,
          filters,
        });

        if (!ignore) {
          setMachines(result);
        }
      } catch (error) {
        if (!ignore) {
          if (error instanceof ApiError) {
            setFeedback(error.message);
          } else {
            setFeedback('No se pudo cargar la maquinaria.');
          }
        }
      } finally {
        if (!ignore) {
          setLoadingMachines(false);
        }
      }
    }

    if (session && activeTab === 'home' && homeSubview === 'list') {
      void loadMachines();
    }

    return () => {
      ignore = true;
    };
  }, [activeTab, appliedQuery, filters, homeSubview, session]);

  if (!isHydrating && !session) {
    return <Redirect href={LOGIN_ROUTE} />;
  }

  function toggleFilter(category: FilterCategoryKey, value: string) {
    setFilters((current) => {
      const selectedValues = current[category];
      const alreadySelected = selectedValues.includes(value);

      return {
        ...current,
        [category]: alreadySelected
          ? selectedValues.filter((item) => item !== value)
          : [...selectedValues, value],
      };
    });
  }

  async function loadMachineContext(idMaquina: number) {
    if (!session?.token) {
      return;
    }

    try {
      setDetailLoading(true);
      setDetailFeedback(null);
      setLocationPickerOpen(false);
      setStatusPickerOpen(false);

      const [detail, proposals] = await Promise.all([
        getMachineDetail(idMaquina, session.token),
        getMachineProposals(idMaquina, session.token),
      ]);

      setSelectedMachineDetail(detail);
      setSelectedMachineProposals(proposals);
      setSelectedTargetLocation(String(detail.ubicacion_tipo ?? '').trim().toUpperCase());
      setProposalsExpanded(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setDetailFeedback(error.message);
      } else {
        setDetailFeedback('No se pudo cargar el detalle de la maquina.');
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function openMachineDetail(idMaquina: number) {
    setHomeSubview('detail');
    await loadMachineContext(idMaquina);
  }

  function resetToListView() {
    setHomeSubview('list');
    setDetailFeedback(null);
    setProposalFeedback(null);
    setLocationPickerOpen(false);
    setStatusPickerOpen(false);
  }

  function openProposalForm() {
    setProposalForm(EMPTY_PROPOSAL_FORM);
    setProposalFeedback(null);
    setHomeSubview('proposalForm');
  }

  function updateProposalForm<K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) {
    setProposalForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateProposalForm() {
    if (!proposalForm.cliente.trim()) {
      return 'Introduce el cliente.';
    }

    if (!proposalForm.email_cliente.trim()) {
      return 'Introduce el email del cliente.';
    }

    if (!proposalForm.telefono.trim()) {
      return 'Introduce el telefono del cliente.';
    }

    if (!proposalForm.direccion.trim()) {
      return 'Introduce la direccion.';
    }

    if (!proposalForm.cp.trim()) {
      return 'Introduce el codigo postal.';
    }

    if (!proposalForm.poblacion.trim()) {
      return 'Introduce la poblacion.';
    }

    if (!proposalForm.precio.trim() || Number(proposalForm.precio) <= 0) {
      return 'Introduce un precio valido.';
    }

    if (!proposalForm.fecha_inicio.trim() || !proposalForm.fecha_inicio.includes('T')) {
      return 'fecha_inicio debe ir en formato ISO, por ejemplo 2026-04-30T09:00:00.';
    }

    if (!proposalForm.fecha_fin.trim() || !proposalForm.fecha_fin.includes('T')) {
      return 'fecha_fin debe ir en formato ISO, por ejemplo 2026-05-02T18:00:00.';
    }

    const startDate = new Date(proposalForm.fecha_inicio);
    const endDate = new Date(proposalForm.fecha_fin);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return 'Las fechas seleccionadas no son validas.';
    }

    if (startDate.getTime() >= endDate.getTime()) {
      return 'fecha_inicio debe ser anterior a fecha_fin.';
    }

    return null;
  }

  async function openNavigationOptions() {
    if (!selectedMachineDetail?.maps?.query) {
      return;
    }

    const query = encodeURIComponent(selectedMachineDetail.maps.query);
    const candidates = [
      {
        key: 'waze' as const,
        label: 'Waze',
        scheme: `waze://?q=${query}&navigate=yes`,
        fallback: selectedMachineDetail.maps.waze,
      },
      {
        key: 'google' as const,
        label: 'Maps',
        scheme: `comgooglemaps://?q=${query}&directionsmode=driving`,
        fallback: selectedMachineDetail.maps.google,
      },
      {
        key: 'apple' as const,
        label: 'Apple Mapas',
        scheme: `maps://?q=${query}`,
        fallback: selectedMachineDetail.maps.apple,
      },
    ];

    const available = [];

    for (const candidate of candidates) {
      const canUseScheme = await Linking.canOpenURL(candidate.scheme).catch(() => false);

      if (canUseScheme) {
        available.push({
          key: candidate.key,
          label: candidate.label,
          url: candidate.scheme,
        });
        continue;
      }

      const canUseFallback = await Linking.canOpenURL(candidate.fallback).catch(() => false);

      if (canUseFallback) {
        available.push({
          key: candidate.key,
          label: candidate.label,
          url: candidate.fallback,
        });
      }
    }

    if (available.length === 0) {
      setDetailFeedback('No hay una app de navegacion disponible para abrir esta direccion.');
      return;
    }

    setAvailableNavigationApps(available);
    setNavigationModalOpen(true);
  }

  async function handleOpenNavigation(url: string) {
    try {
      await Linking.openURL(url);
      setNavigationModalOpen(false);
    } catch {
      setDetailFeedback('No se pudo abrir la aplicacion de navegacion.');
    }
  }

  async function handleCreateProposal() {
    if (!session?.token || !selectedMachineDetail) {
      return;
    }

    const validationError = validateProposalForm();

    if (validationError) {
      setProposalFeedback(validationError);
      return;
    }

    try {
      setProposalSubmitting(true);
      setProposalFeedback(null);

      const response = await createMachineProposal(
        selectedMachineDetail.id_maquina,
        proposalForm,
        session.token
      );

      await loadMachineContext(selectedMachineDetail.id_maquina);
      setHomeSubview('detail');
      setDetailFeedback(
        response.email_sent === false
          ? 'Propuesta creada, pero no se pudo enviar el email.'
          : 'Propuesta creada correctamente.'
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setProposalFeedback(error.message);
      } else {
        setProposalFeedback('No se pudo crear la propuesta.');
      }
    } finally {
      setProposalSubmitting(false);
    }
  }

  async function handleLocationChange(nextLocation: string) {
    setSelectedTargetLocation(nextLocation);
    setLocationPickerOpen(false);
  }

  async function handleConfirmLocation() {
    if (!session?.token || !selectedMachineDetail) {
      return;
    }

    const currentLocation = String(selectedMachineDetail.ubicacion_tipo ?? '').trim().toUpperCase();
    const nextLocation = selectedTargetLocation || currentLocation;

    if (nextLocation === currentLocation) {
      return;
    }

    try {
      setLocationActionLoading(true);
      setDetailFeedback(null);

      if (nextLocation === 'CLIENTE') {
        await markMachineDelivered(selectedMachineDetail.id_maquina, session.token);
      } else if (currentLocation === 'TRANSITO') {
        await markMachineArrivedAtBase(
          selectedMachineDetail.id_maquina,
          nextLocation === 'ALMACEN' ? 'almacen' : 'taller',
          session.token
        );
      } else {
        await moveMachineBetweenBases(
          selectedMachineDetail.id_maquina,
          nextLocation === 'ALMACEN' ? 'almacen' : 'taller',
          session.token
        );
      }

      await loadMachineContext(selectedMachineDetail.id_maquina);
    } catch (error) {
      if (error instanceof ApiError) {
        setDetailFeedback(error.message);
      } else {
        setDetailFeedback('No se pudo actualizar la ubicacion.');
      }
    } finally {
      setLocationActionLoading(false);
    }
  }

  async function handleMaintenanceChange(nextStatus: string) {
    if (!session?.token || !selectedMachineDetail) {
      return;
    }

    const currentStatus = String(selectedMachineDetail.maintenance_status ?? '').trim().toUpperCase();

    if (nextStatus === currentStatus) {
      setStatusPickerOpen(false);
      return;
    }

    try {
      setStatusActionLoading(true);
      setDetailFeedback(null);

      await updateMachineMaintenanceStatus(
        selectedMachineDetail.id_maquina,
        nextStatus,
        session.token
      );

      setStatusPickerOpen(false);
      await loadMachineContext(selectedMachineDetail.id_maquina);
    } catch (error) {
      if (error instanceof ApiError) {
        setDetailFeedback(error.message);
      } else {
        setDetailFeedback('No se pudo actualizar el estado.');
      }

      await loadMachineContext(selectedMachineDetail.id_maquina);
    } finally {
      setStatusActionLoading(false);
    }
  }

  async function handleMarkDelivered() {
    await handleConfirmLocation();
  }

  function renderMachineList() {
    return (
      <View style={styles.homeContent}>
        <Image
          resizeMode="contain"
          source={require('@/assets/images/tecarral-logo.jpg')}
          style={styles.homeLogo}
        />

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons color={AppColors.primary50} name="search" size={18} />
            <TextInput
              placeholder="Buscar..."
              placeholderTextColor={AppColors.primary50}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <Pressable style={styles.filterButton} onPress={() => setFilterPanelOpen((open) => !open)}>
            <Text style={styles.filterButtonText}>
              Filtrar{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </Pressable>
        </View>

        {query.trim().length >= 2 && (suggestions.length > 0 || loadingSuggestions) ? (
          <View style={styles.suggestionsBox}>
            {loadingSuggestions ? (
              <Text style={styles.suggestionText}>Buscando sugerencias...</Text>
            ) : (
              suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  onPress={() => {
                    setQuery(suggestion.label);
                    setSuggestions([]);
                  }}
                  style={styles.suggestionItem}>
                  <Text style={styles.suggestionText}>{suggestion.label}</Text>
                  <Text style={styles.suggestionSource}>{suggestion.source}</Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        {filterPanelOpen ? (
          <>
            <FilterPanel
              filters={filters}
              onClose={() => setFilterPanelOpen(false)}
              onToggle={toggleFilter}
            />
            <View style={styles.filterPanelSpacer} />
          </>
        ) : null}

        {feedback ? (
          <Text style={[styles.feedbackText, filterPanelOpen && styles.feedbackTextWithFilter]}>
            {feedback}
          </Text>
        ) : null}

        {loadingMachines ? (
          <Text style={styles.loadingText}>Cargando maquinaria...</Text>
        ) : (
          <FlatList
            columnWrapperStyle={styles.machineGridRow}
            contentContainerStyle={styles.machineListContent}
            data={visibleMachines}
            keyExtractor={(item) => String(item.id_maquina)}
            numColumns={2}
            renderItem={({ item }) => (
              <MachineCard item={item} onPress={() => void openMachineDetail(item.id_maquina)} width={cardWidth} />
            )}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hay maquinaria para esos filtros.</Text>
              </View>
            }
          />
        )}
      </View>
    );
  }

  function renderMachineDetail() {
    if (detailLoading) {
      return (
        <View style={styles.centeredBlock}>
          <ActivityIndicator color={AppColors.primary} />
          <Text style={styles.loadingText}>Cargando detalle...</Text>
        </View>
      );
    }

    if (!selectedMachineDetail) {
      return (
        <View style={styles.centeredBlock}>
          <Text style={styles.emptyStateText}>No se pudo cargar el detalle de la maquina.</Text>
        </View>
      );
    }

    const locationValue = formatLocationLabel(
      selectedTargetLocation || selectedMachineDetail.ubicacion_tipo
    );
    const statusValue = formatMaintenanceLabel(selectedMachineDetail.maintenance_status);
    const isElevation =
      normalizeValue(selectedMachineDetail.tipo_maquina) === 'elevacion';

    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHero}>
          <Pressable onPress={resetToListView} style={styles.detailCloseButton}>
            <Ionicons color={AppColors.primary} name="close-circle-outline" size={28} />
          </Pressable>
          {machineImageSource ? (
            <ExpoImage contentFit="contain" source={machineImageSource} style={styles.detailImage} />
          ) : (
            <Ionicons color={AppColors.primary50} name="image-outline" size={42} />
          )}
        </View>

        <Text style={styles.detailTitle}>Maquina #{selectedMachineDetail.id_maquina}</Text>

        {detailFeedback ? <Text style={styles.feedbackText}>{detailFeedback}</Text> : null}

        <FieldRow label="Nombre" value={formatMachineName(selectedMachineDetail)} />

        {COMMON_DETAIL_FIELDS.map((field) => (
          <FieldRow key={field.key} label={field.label} value={selectedMachineDetail[field.key]} />
        ))}

        <Text style={styles.detailLine}>
          <Text style={styles.detailLabel}>Seguro: </Text>
          <Text style={styles.detailValue}>
            {selectedMachineDetail.seguro === true
              ? 'Si'
              : selectedMachineDetail.seguro === false
                ? 'No'
                : '-'}
          </Text>
        </Text>

        <View style={styles.detailActionsRow}>
          <View style={styles.detailActionsColumn}>
            <SelectorField
              disabled={locationActionLoading || locationOptions.length <= 0}
              isOpen={locationPickerOpen}
              label="Ubicacion"
              onSelect={(value) => handleLocationChange(value)}
              onToggleOpen={() => {
                setStatusPickerOpen(false);
                setLocationPickerOpen((current) => !current);
              }}
              options={locationOptions}
              valueLabel={locationValue}
            />
          </View>

          {canMarkDelivered ? (
            <Pressable
              onPress={() => void handleMarkDelivered()}
              style={[styles.secondaryActionButton, locationActionLoading && styles.actionButtonDisabled]}>
              <Text style={styles.secondaryActionButtonText}>
                {locationActionLoading ? 'Procesando...' : 'Confirmar ubicacion'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <SelectorField
          disabled={statusActionLoading || maintenanceOptions.length <= 1}
          isOpen={statusPickerOpen}
          label="Estado"
          onSelect={(value) => void handleMaintenanceChange(value)}
          onToggleOpen={() => {
            setLocationPickerOpen(false);
            setStatusPickerOpen((current) => !current);
          }}
          options={maintenanceOptions}
          valueLabel={statusValue}
        />

        {selectedMachineDetail.maps?.query ? (
          <View style={styles.mapsRow}>
            <View style={styles.mapsTextBlock}>
              <FieldRow label="Maps" value={selectedMachineDetail.maps.query} />
            </View>
            <Pressable onPress={() => void openNavigationOptions()} style={styles.mapsActionButton}>
              <Ionicons color={AppColors.primary} name="navigate" size={20} />
            </Pressable>
          </View>
        ) : null}

        {isElevation
          ? ELEVATION_DETAIL_FIELDS.map((field) => (
              <FieldRow key={field.key} label={field.label} value={selectedMachineDetail[field.key]} />
            ))
          : null}

        <View style={styles.sectionBlock}>
          <Pressable
            onPress={() => setProposalsExpanded((current) => !current)}
            style={styles.sectionHeaderButton}>
            <Text style={styles.sectionTitle}>Propuestas de alquiler</Text>
            <Ionicons
              color={AppColors.primary}
              name={proposalsExpanded ? 'chevron-up' : 'chevron-down'}
              size={22}
            />
          </Pressable>
          {acceptedProposal ? (
            <Text style={styles.acceptedProposalText}>
              Hay una propuesta aceptada: #{acceptedProposal.id}
            </Text>
          ) : (
            <Text style={styles.sectionHint}>No hay propuesta aceptada para esta maquina.</Text>
          )}

          {proposalsExpanded ? (
            selectedMachineProposals.length === 0 ? (
              <Text style={styles.sectionHint}>Todavia no hay propuestas registradas.</Text>
            ) : (
              selectedMachineProposals.map((proposal) => (
                <ProposalCard item={proposal} key={proposal.id} />
              ))
            )
          ) : null}
        </View>

        {canCreateProposal ? (
          <Pressable onPress={openProposalForm} style={styles.primaryActionButton}>
            <Text style={styles.primaryActionButtonText}>Crear propuesta de alquiler</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  function renderProposalForm() {
    if (!selectedMachineDetail) {
      return (
        <View style={styles.centeredBlock}>
          <Text style={styles.emptyStateText}>No hay maquina seleccionada.</Text>
        </View>
      );
    }

    return (
      <View style={styles.detailContainer}>
        <Pressable onPress={() => setHomeSubview('detail')} style={styles.formBackButton}>
          <Ionicons color={AppColors.primary} name="arrow-back" size={22} />
          <Text style={styles.formBackButtonText}>Volver al detalle</Text>
        </Pressable>

        <Text style={styles.detailTitle}>Nueva propuesta</Text>

        <View style={styles.proposalSummaryCard}>
          <Text style={styles.proposalSummaryTitle}>Maquina seleccionada</Text>
          <FieldRow label="ID" value={selectedMachineDetail.id_maquina} />
          <FieldRow label="Nombre" value={formatMachineName(selectedMachineDetail)} />
          <FieldRow label="Marca" value={selectedMachineDetail.marca} />
          <FieldRow label="Modelo" value={selectedMachineDetail.modelo} />
          <FieldRow label="Ubicacion" value={formatLocationLabel(selectedMachineDetail.ubicacion_tipo)} />
          <FieldRow
            label="Disponibilidad"
            value={selectedMachineDetail.availability_status}
          />
        </View>

        {proposalFeedback ? <Text style={styles.feedbackText}>{proposalFeedback}</Text> : null}

        <TextInput
          onChangeText={(value) => updateProposalForm('cliente', value)}
          placeholder="Cliente"
          placeholderTextColor={AppColors.primary50}
          style={styles.formInput}
          value={proposalForm.cliente}
        />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={(value) => updateProposalForm('email_cliente', value)}
          placeholder="Email cliente"
          placeholderTextColor={AppColors.primary50}
          style={styles.formInput}
          value={proposalForm.email_cliente}
        />
        <TextInput
          keyboardType="phone-pad"
          onChangeText={(value) => updateProposalForm('telefono', value)}
          placeholder="Telefono"
          placeholderTextColor={AppColors.primary50}
          style={styles.formInput}
          value={proposalForm.telefono}
        />
        <TextInput
          onChangeText={(value) => updateProposalForm('direccion', value)}
          placeholder="Direccion"
          placeholderTextColor={AppColors.primary50}
          style={styles.formInput}
          value={proposalForm.direccion}
        />
        <TextInput
          onChangeText={(value) => updateProposalForm('cp', value)}
          placeholder="Codigo postal"
          placeholderTextColor={AppColors.primary50}
          style={styles.formInput}
          value={proposalForm.cp}
        />
        <TextInput
          onChangeText={(value) => updateProposalForm('poblacion', value)}
          placeholder="Poblacion"
          placeholderTextColor={AppColors.primary50}
          style={styles.formInput}
          value={proposalForm.poblacion}
        />
        <TextInput
          keyboardType="numeric"
          onChangeText={(value) => updateProposalForm('precio', value)}
          placeholder="Precio"
          placeholderTextColor={AppColors.primary50}
          style={styles.formInput}
          value={proposalForm.precio}
        />
        <DateTimePickerField
          label="Fecha inicio"
          onChange={(value) => updateProposalForm('fecha_inicio', value)}
          placeholder="Selecciona fecha y hora"
          value={proposalForm.fecha_inicio}
        />
        <DateTimePickerField
          label="Fecha fin"
          onChange={(value) => updateProposalForm('fecha_fin', value)}
          placeholder="Selecciona fecha y hora"
          value={proposalForm.fecha_fin}
        />

        <Pressable
          onPress={() => void handleCreateProposal()}
          style={[styles.primaryActionButton, proposalSubmitting && styles.actionButtonDisabled]}>
          <Text style={styles.primaryActionButtonText}>
            {proposalSubmitting ? 'Guardando...' : 'Crear propuesta'}
          </Text>
        </Pressable>
      </View>
    );
  }

  function renderHomeContent() {
    if (homeSubview === 'detail') {
      return renderMachineDetail();
    }

    if (homeSubview === 'proposalForm') {
      return renderProposalForm();
    }

    return renderMachineList();
  }

  function renderTabContent() {
    if (activeTab === 'home') {
      return renderHomeContent();
    }

    if (activeTab === 'albaran') {
      return (
        <PlaceholderTab
          subtitle="Aqui dejaremos preparada la base para el contenido de albaranes."
          title="Ventana albaran"
        />
      );
    }

    if (activeTab === 'reparacion') {
      return (
        <PlaceholderTab
          subtitle="Aqui dejaremos preparada la base para el contenido de reparaciones."
          title="Ventana reparacion"
        />
      );
    }

    return (
      <PlaceholderTab
        subtitle="Aqui dejaremos preparada la base para la informacion del usuario."
        title="Ventana user"
      />
    );
  }

  const scrollBottomPadding = filterPanelOpen && homeSubview === 'list' ? 300 : 126;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      <View style={[styles.tabBar, { width: tabBarWidth }]}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              width: indicatorWidth,
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />

        {TAB_KEYS.map((tab) => {
          const iconName =
            tab === 'home'
              ? 'home-outline'
              : tab === 'albaran'
                ? 'document-text-outline'
                : tab === 'reparacion'
                  ? 'settings-outline'
                  : 'person-outline';
          const active = activeTab === tab;

          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, { width: tabSlotWidth }]}>
              <Ionicons
                color={active ? AppColors.primary : '#111111'}
                name={iconName}
                size={TAB_ICON_SIZE}
              />
            </Pressable>
          );
        })}
      </View>

      <Modal animationType="fade" transparent visible={navigationModalOpen}>
        <View style={styles.modalOverlay}>
          <View style={styles.navigationModalCard}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Abrir navegacion</Text>
              <Pressable onPress={() => setNavigationModalOpen(false)}>
                <Ionicons color={AppColors.primary} name="close-circle-outline" size={24} />
              </Pressable>
            </View>

            {availableNavigationApps.map((app) => (
              <Pressable
                key={app.key}
                onPress={() => void handleOpenNavigation(app.url)}
                style={styles.navigationOptionButton}>
                <Ionicons color={AppColors.primary} name="navigate-outline" size={18} />
                <Text style={styles.navigationOptionText}>{app.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  homeContent: {
    position: 'relative',
    paddingTop: 18,
  },
  homeLogo: {
    alignSelf: 'center',
    width: 190,
    height: 54,
    marginBottom: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.secondary65,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: AppColors.inputText,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterButton: {
    minWidth: 92,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.secondary65,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  filterButtonText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionsBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.primary20,
    backgroundColor: AppColors.background,
    marginBottom: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.primary20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionText: {
    color: AppColors.text,
    fontSize: 14,
    flexShrink: 1,
  },
  suggestionSource: {
    color: AppColors.primary50,
    fontSize: 12,
    marginLeft: 10,
    textTransform: 'capitalize',
  },
  filterPanelWrapper: {
    position: 'absolute',
    top: 88,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  filterPanelSpacer: {
    height: 440,
  },
  filterPanel: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: '#66B2C6',
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 16,
  },
  filterCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    color: AppColors.background,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
  },
  filterChipText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: AppColors.background,
  },
  machineListContent: {
    paddingTop: 10,
    paddingBottom: 6,
  },
  machineGridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  machineCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.background,
    overflow: 'hidden',
  },
  machineMedia: {
    height: 116,
    backgroundColor: '#CFEAF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineImage: {
    width: '100%',
    height: 96,
  },
  machineInfo: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 3,
  },
  machineLine: {
    color: '#222222',
    fontSize: 11,
    lineHeight: 14,
  },
  machineLabel: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  detailContainer: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  detailHero: {
    marginHorizontal: -24,
    minHeight: 280,
    backgroundColor: '#A9D9E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    marginBottom: 18,
    overflow: 'hidden',
  },
  detailCloseButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
  },
  detailImage: {
    width: '100%',
    height: 250,
  },
  detailTitle: {
    color: AppColors.primary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  detailLine: {
    color: '#111111',
    fontSize: 16,
    lineHeight: 24,
  },
  detailLabel: {
    color: '#111111',
    fontWeight: '600',
  },
  detailValue: {
    color: AppColors.primary,
  },
  detailActionsRow: {
    gap: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  detailActionsColumn: {
    flex: 1,
  },
  selectorBlock: {
    marginBottom: 8,
  },
  selectorButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  selectorButtonDisabled: {
    opacity: 0.6,
  },
  selectorButtonText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  selectorList: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    marginTop: 6,
    overflow: 'hidden',
  },
  selectorListItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.primary20,
  },
  selectorListItemText: {
    color: AppColors.primary,
    fontSize: 14,
  },
  primaryActionButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: AppColors.secondary,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
  },
  primaryActionButtonText: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryActionButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: AppColors.primary20,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  secondaryActionButtonText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  sectionBlock: {
    marginTop: 20,
  },
  mapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapsTextBlock: {
    flex: 1,
  },
  mapsActionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    color: AppColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHint: {
    color: AppColors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  acceptedProposalText: {
    color: AppColors.success,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  proposalCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.primary20,
    backgroundColor: '#F7FBFD',
    padding: 12,
    marginBottom: 10,
  },
  proposalCardTitle: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  proposalCardLine: {
    color: '#111111',
    fontSize: 13,
    lineHeight: 19,
  },
  proposalSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.primary20,
    backgroundColor: '#F7FBFD',
    padding: 14,
    marginBottom: 14,
  },
  proposalSummaryTitle: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  formBackButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  formBackButtonText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  formFieldLabel: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.background,
    color: AppColors.inputText,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dateFieldBlock: {
    marginBottom: 10,
  },
  formInputButton: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: AppColors.primary50,
    backgroundColor: AppColors.background,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formInputButtonText: {
    color: AppColors.inputText,
    fontSize: 15,
    flex: 1,
    marginRight: 10,
  },
  formInputPlaceholder: {
    color: AppColors.primary50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  datePickerCard: {
    backgroundColor: AppColors.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  datePickerTitle: {
    color: AppColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  datePickerMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  datePickerMonthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary20,
  },
  datePickerMonthLabel: {
    color: AppColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calendarWeekday: {
    width: '14.28%',
    textAlign: 'center',
    color: AppColors.primary50,
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  calendarDaySelected: {
    backgroundColor: AppColors.primary,
  },
  calendarDayText: {
    color: AppColors.primary,
    fontSize: 14,
  },
  calendarDayTextMuted: {
    color: AppColors.primary50,
  },
  calendarDayTextSelected: {
    color: AppColors.background,
    fontWeight: '700',
  },
  datePickerSectionTitle: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timePickerRow: {
    marginBottom: 12,
  },
  timePickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  timeChip: {
    minWidth: 52,
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 8,
  },
  timeChipActive: {
    backgroundColor: AppColors.primary,
  },
  timeChipText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: AppColors.background,
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  datePickerSecondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
  },
  datePickerSecondaryText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerPrimaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.secondary,
  },
  datePickerPrimaryText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  datePickerPreview: {
    color: AppColors.primary50,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  navigationModalCard: {
    backgroundColor: AppColors.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: AppColors.primary20,
  },
  navigationOptionButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  navigationOptionText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  feedbackText: {
    color: AppColors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  feedbackTextWithFilter: {
    marginTop: 12,
  },
  loadingText: {
    color: AppColors.text,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyState: {
    paddingVertical: 36,
  },
  emptyStateText: {
    color: AppColors.primary,
    fontSize: 15,
    textAlign: 'center',
  },
  centeredBlock: {
    minHeight: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 90,
    minHeight: 420,
  },
  placeholderLogo: {
    width: 180,
    height: 54,
    marginBottom: 18,
  },
  placeholderTitle: {
    color: AppColors.primary,
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: AppColors.text,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  tabBar: {
    position: 'absolute',
    left: TAB_BAR_HORIZONTAL_PADDING,
    right: TAB_BAR_HORIZONTAL_PADDING,
    bottom: 20,
    height: 74,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TAB_BAR_INNER_PADDING,
  },
  tabIndicator: {
    position: 'absolute',
    top: 7,
    left: 0,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.primary20,
  },
  tabButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
