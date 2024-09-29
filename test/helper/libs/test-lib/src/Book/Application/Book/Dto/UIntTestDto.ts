import { Dto, v } from '@hexancore/common';

export class UIntTestDto extends Dto<UIntTestDto> {

  public field!: v.uint;
  public optionalField?: v.uint;

  public minField!: v.uint.min<0>;
  public maxField!: v.uint.max<100>;
  public betweenField!: v.uint.between<0, 100>;

  public gtField!: v.uint.gt<0>;
  public ltField!: v.uint.lt<100>;
  public betweenExclusivelyField!: v.uint.between_exclusively<0, 100>;

  public arrayField!: v.uint[];
  public optionalArrayField?: v.uint[];

  public maxArrayField!: v.uint.max<100>[];

}