import { Dto, v } from '@hexancore/common';

export class ArrayItemsTestDto extends Dto<ArrayItemsTestDto> {

  public arrayMinItemsField!: v.int[] & v.items.min<2>;
  public arrayMaxItemsField!: v.int[] & v.items.max<2>;
  public arrayExaclyItemsField!: v.int[] & v.items.exactly<2>;
  public arrayBetweenItemsField!: v.int[] & v.items.between<0, 2>;
  
  public optionalArrayItemsField?: v.int[] & v.items.min<2>;
}