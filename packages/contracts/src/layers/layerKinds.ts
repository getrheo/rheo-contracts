export const LAYER_KINDS = [
  'stack',
  'text',
  'image',
  'lottie',
  'video',
  'icon',
  'button',
  'back_button',
  'progress',
  'loader',
  'counter',
  'single_choice',
  'multiple_choice',
  'text_input',
  'scale_input',
  'oauth_provider',
  'oauth_login',
  'email_password_auth',
  'email_password_field',
  'email_password_submit',
  'carousel',
  'hyperlink',
  'checkbox',
] as const;
export type LayerKind = (typeof LAYER_KINDS)[number];

export const INPUT_LAYER_KINDS = [
  'single_choice',
  'multiple_choice',
  'text_input',
  'scale_input',
] as const;
export type InputLayerKind = (typeof INPUT_LAYER_KINDS)[number];
