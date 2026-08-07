import type {
  StackLayerRaw,
  TextLayerRaw,
  ImageLayerRaw,
  LottieLayerRaw,
  VideoLayerRaw,
  IconLayerRaw,
  HyperlinkLayerRaw,
} from './layout.js';
import type {
  ButtonLayerRaw,
  BackButtonLayerRaw,
  ProgressLayerRaw,
  LoaderLayerRaw,
  CounterLayerRaw,
} from './chrome.js';
import type {
  SingleChoiceLayerRaw,
  MultipleChoiceLayerRaw,
  TextInputLayerRaw,
  ScaleInputLayerRaw,
  WheelPickerLayerRaw,
  CheckboxLayerRaw,
} from './input.js';
import type {
  DateTimeInputLayerRaw,
  NumberStepperLayerRaw,
  NumberStepperButtonLayerRaw,
  NumberStepperValueLayerRaw,
  PhoneInputLayerRaw,
  AddressInputLayerRaw,
} from './formPatterns.js';
import type {
  OAuthProviderLayerRaw,
  OAuthLoginLayerRaw,
  EmailPasswordFieldLayerRaw,
  EmailPasswordSubmitLayerRaw,
  EmailPasswordAuthLayerRaw,
} from './auth.js';
import type { CarouselLayerRaw } from './carousel.js';
import type { ConditionalLayerRaw } from './conditional.js';

export type LayerRaw =
  | StackLayerRaw
  | TextLayerRaw
  | ImageLayerRaw
  | LottieLayerRaw
  | VideoLayerRaw
  | IconLayerRaw
  | ButtonLayerRaw
  | BackButtonLayerRaw
  | ProgressLayerRaw
  | LoaderLayerRaw
  | CounterLayerRaw
  | CheckboxLayerRaw
  | SingleChoiceLayerRaw
  | MultipleChoiceLayerRaw
  | TextInputLayerRaw
  | ScaleInputLayerRaw
  | WheelPickerLayerRaw
  | DateTimeInputLayerRaw
  | NumberStepperLayerRaw
  | NumberStepperButtonLayerRaw
  | NumberStepperValueLayerRaw
  | PhoneInputLayerRaw
  | AddressInputLayerRaw
  | OAuthProviderLayerRaw
  | OAuthLoginLayerRaw
  | EmailPasswordFieldLayerRaw
  | EmailPasswordSubmitLayerRaw
  | EmailPasswordAuthLayerRaw
  | CarouselLayerRaw
  | ConditionalLayerRaw
  | HyperlinkLayerRaw;
