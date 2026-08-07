import type {
  StackLayerRaw,
  TextLayerRaw,
  ImageLayerRaw,
  LottieLayerRaw,
  VideoLayerRaw,
  IconLayerRaw,
  ButtonLayerRaw,
  BackButtonLayerRaw,
  ProgressLayerRaw,
  LoaderOnCompleteRaw,
  LoaderLayerRaw,
  CounterLayerRaw,
  CheckboxLayerRaw,
  SingleChoiceLayerRaw,
  MultipleChoiceLayerRaw,
  TextInputLayerRaw,
  ScaleInputLayerRaw,
  WheelPickerLayerRaw,
  DateTimeInputLayerRaw,
  NumberStepperLayerRaw,
  NumberStepperButtonLayerRaw,
  NumberStepperValueLayerRaw,
  PhoneInputLayerRaw,
  AddressInputLayerRaw,
  OAuthLoginLayerRaw,
  EmailPasswordAuthLayerRaw,
  EmailPasswordFieldLayerRaw,
  EmailPasswordSubmitLayerRaw,
  OAuthProviderPresetLayerRaw,
  OAuthProviderCustomLayerRaw,
  OAuthProviderLayerRaw,
  CarouselLayerRaw,
  ConditionalLayerRaw,
  ConditionalCaseRaw,
  HyperlinkLayerRaw,
  LayerRaw,
} from './layerRawTypes.js';

export type Layer = LayerRaw;
export type StackLayer = StackLayerRaw;
export type TextLayer = TextLayerRaw;
export type ImageLayer = ImageLayerRaw;
export type LottieLayer = LottieLayerRaw;
export type VideoLayer = VideoLayerRaw;
export type IconLayer = IconLayerRaw;
export type ButtonLayer = ButtonLayerRaw;
export type BackButtonLayer = BackButtonLayerRaw;
export type ProgressLayer = ProgressLayerRaw;
export type LoaderOnComplete = LoaderOnCompleteRaw;
export type LoaderLayer = LoaderLayerRaw;
export type CounterLayer = CounterLayerRaw;
export type CheckboxLayer = CheckboxLayerRaw;
export type SingleChoiceLayer = SingleChoiceLayerRaw;
export type MultipleChoiceLayer = MultipleChoiceLayerRaw;
export type TextInputLayer = TextInputLayerRaw;
export type ScaleInputLayer = ScaleInputLayerRaw;
export type WheelPickerLayer = WheelPickerLayerRaw;
export type DateTimeInputLayer = DateTimeInputLayerRaw;
export type NumberStepperLayer = NumberStepperLayerRaw;
export type NumberStepperButtonLayer = NumberStepperButtonLayerRaw;
export type NumberStepperValueLayer = NumberStepperValueLayerRaw;
export type PhoneInputLayer = PhoneInputLayerRaw;
export type AddressInputLayer = AddressInputLayerRaw;
export type OAuthLoginLayer = OAuthLoginLayerRaw;
export type EmailPasswordAuthLayer = EmailPasswordAuthLayerRaw;
export type EmailPasswordFieldLayer = EmailPasswordFieldLayerRaw;
export type EmailPasswordSubmitLayer = EmailPasswordSubmitLayerRaw;
export type OAuthProviderPresetLayer = OAuthProviderPresetLayerRaw;
export type OAuthProviderCustomLayer = OAuthProviderCustomLayerRaw;
export type OAuthProviderLayer = OAuthProviderLayerRaw;
export type CarouselLayer = CarouselLayerRaw;
export type ConditionalLayer = ConditionalLayerRaw;
export type ConditionalLayerCase = ConditionalCaseRaw;
export type HyperlinkLayer = HyperlinkLayerRaw;
export type InputLayer =
  | SingleChoiceLayer
  | MultipleChoiceLayer
  | TextInputLayer
  | ScaleInputLayer
  | WheelPickerLayer
  | DateTimeInputLayer
  | NumberStepperLayer
  | PhoneInputLayer
  | AddressInputLayer;

export const isInputLayer = (l: Layer): l is InputLayer =>
  l.kind === 'single_choice' ||
  l.kind === 'multiple_choice' ||
  l.kind === 'text_input' ||
  l.kind === 'scale_input' ||
  l.kind === 'wheel_picker' ||
  l.kind === 'date_time_input' ||
  l.kind === 'number_stepper' ||
  l.kind === 'phone_input' ||
  l.kind === 'address_input';

export const isParentLayer = (
  l: Layer,
): l is
  | StackLayer
  | CarouselLayer
  | ConditionalLayer
  | ButtonLayer
  | BackButtonLayer
  | HyperlinkLayer
  | SingleChoiceLayer
  | MultipleChoiceLayer
  | TextInputLayer
  | ScaleInputLayer
  | WheelPickerLayer
  | DateTimeInputLayer
  | NumberStepperLayer
  | NumberStepperButtonLayer
  | PhoneInputLayer
  | AddressInputLayer
  | OAuthLoginLayer
  | OAuthProviderCustomLayer
  | EmailPasswordAuthLayer
  | EmailPasswordFieldLayer
  | EmailPasswordSubmitLayer =>
  l.kind === 'stack' ||
  l.kind === 'carousel' ||
  l.kind === 'conditional' ||
  l.kind === 'button' ||
  l.kind === 'back_button' ||
  l.kind === 'hyperlink' ||
  l.kind === 'single_choice' ||
  l.kind === 'multiple_choice' ||
  l.kind === 'text_input' ||
  l.kind === 'scale_input' ||
  l.kind === 'wheel_picker' ||
  l.kind === 'date_time_input' ||
  l.kind === 'number_stepper' ||
  l.kind === 'number_stepper_button' ||
  l.kind === 'phone_input' ||
  l.kind === 'address_input' ||
  l.kind === 'oauth_login' ||
  (l.kind === 'oauth_provider' && l.variant === 'custom') ||
  l.kind === 'email_password_auth' ||
  l.kind === 'email_password_field' ||
  l.kind === 'email_password_submit';
