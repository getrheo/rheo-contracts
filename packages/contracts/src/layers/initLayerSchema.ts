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
} from './kinds/input.js';
import { CarouselLayerSchema } from './kinds/carousel.js';

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
    OAuthLoginLayerSchema,
    OAuthProviderPresetLayerSchema,
    OAuthProviderCustomLayerSchema,
    EmailPasswordAuthLayerSchema,
    EmailPasswordFieldLayerSchema,
    EmailPasswordSubmitLayerSchema,
    CarouselLayerSchema,
  ]),
) as unknown as z.ZodType<LayerRaw>;

export const LayerSchema = layerSchemaStore.schema!;
