import { z } from 'zod';
import { layerSchemaStore } from './layerSchemaRef.js';
import type { LayerRaw } from './layerRawTypes.js';
import {
  StackLayerSchema,
  TextLayerSchema,
  HyperlinkLayerSchema,
  ImageLayerSchema,
  LottieLayerSchema,
  VideoLayerSchema,
  IconLayerSchema,
} from './kinds/layout.js';
import {
  OAuthLoginLayerSchema,
  OAuthProviderPresetLayerSchema,
  OAuthProviderCustomLayerSchema,
  EmailPasswordAuthLayerSchema,
  EmailPasswordFieldLayerSchema,
  EmailPasswordSubmitLayerSchema,
} from './kinds/auth.js';
import {
  ButtonLayerSchema,
  BackButtonLayerSchema,
  ProgressLayerSchema,
  LoaderLayerSchema,
  CounterLayerSchema,
  CheckboxLayerSchema,
} from './kinds/chrome.js';
import {
  SingleChoiceLayerSchema,
  MultipleChoiceLayerSchema,
  TextInputLayerSchema,
  ScaleInputLayerSchema,
  WheelPickerLayerSchema,
} from './kinds/input.js';
import {
  DateTimeInputLayerSchema,
  NumberStepperLayerSchema,
  NumberStepperButtonLayerSchema,
  NumberStepperValueLayerSchema,
  PhoneInputLayerSchema,
  AddressInputLayerSchema,
} from './kinds/formPatterns.js';
import { CarouselLayerSchema } from './kinds/carousel.js';
import { ConditionalLayerSchema } from './kinds/conditional.js';

layerSchemaStore.schema = z.lazy(() =>
  z.union([
    StackLayerSchema,
    TextLayerSchema,
    HyperlinkLayerSchema,
    ImageLayerSchema,
    LottieLayerSchema,
    VideoLayerSchema,
    IconLayerSchema,
    ButtonLayerSchema,
    BackButtonLayerSchema,
    ProgressLayerSchema,
    LoaderLayerSchema,
    CounterLayerSchema,
    CheckboxLayerSchema,
    SingleChoiceLayerSchema,
    MultipleChoiceLayerSchema,
    TextInputLayerSchema,
    ScaleInputLayerSchema,
    WheelPickerLayerSchema,
    DateTimeInputLayerSchema,
    NumberStepperLayerSchema,
    NumberStepperButtonLayerSchema,
    NumberStepperValueLayerSchema,
    PhoneInputLayerSchema,
    AddressInputLayerSchema,
    OAuthLoginLayerSchema,
    OAuthProviderPresetLayerSchema,
    OAuthProviderCustomLayerSchema,
    EmailPasswordAuthLayerSchema,
    EmailPasswordFieldLayerSchema,
    EmailPasswordSubmitLayerSchema,
    CarouselLayerSchema,
    ConditionalLayerSchema,
  ]),
) as unknown as z.ZodType<LayerRaw>;

export const LayerSchema = layerSchemaStore.schema!;
