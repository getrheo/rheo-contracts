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
  'wheel_picker',
  'date_time_input',
  'number_stepper',
  'number_stepper_button',
  'number_stepper_value',
  'phone_input',
  'address_input',
  'oauth_provider',
  'oauth_login',
  'email_password_auth',
  'email_password_field',
  'email_password_submit',
  'carousel',
  'hyperlink',
  'checkbox',
  'conditional',
] as const;
export type LayerKind = (typeof LAYER_KINDS)[number];

export const INPUT_LAYER_KINDS = [
  'single_choice',
  'multiple_choice',
  'text_input',
  'scale_input',
  'wheel_picker',
  'date_time_input',
  'number_stepper',
  'phone_input',
  'address_input',
] as const;
export type InputLayerKind = (typeof INPUT_LAYER_KINDS)[number];

/** Input kinds that collect a draft and require an explicit Continue button. */
export const MANUAL_SUBMIT_INPUT_KINDS = [
  'multiple_choice',
  'text_input',
  'scale_input',
  'wheel_picker',
  'date_time_input',
  'number_stepper',
  'phone_input',
  'address_input',
] as const;
export type ManualSubmitInputKind = (typeof MANUAL_SUBMIT_INPUT_KINDS)[number];
