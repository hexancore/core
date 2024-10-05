import { Dto, v } from '@hexancore/common';

export class StringTestDto extends Dto {

  public field!: string;
  public optionalField?: string;

  public lengthField!: v.string.length<5>;
  public lengthMinField!: v.string.length.min<5>;
  public lengthMaxField!: v.string.length.max<20>;
  public lengthBetweenField!: v.string.length.between<5, 20>;

  public regexField!: v.string.regex<'[a-z]{2}\\d{3}'>;

  public arrayField!: v.string.length.min<5>[];
  public optionalArrayField?: v.string.length.min<5>[];
}