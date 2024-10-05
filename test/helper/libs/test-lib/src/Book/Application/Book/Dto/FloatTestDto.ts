import { Dto, v } from '@hexancore/common';

export class FloatTestDto extends Dto {

  public field!: v.float;
  public optionalField?: v.float;

  public minField!: v.float.min<-100>;
  public maxField!: v.float.max<100>;

  public betweenField!: v.float.between<-100, 100>;

  public gtField!: v.float.gt<-100>;
  public ltField!: v.float.lt<100>;

  public betweenExclusivelyField!: v.float.between_exclusively<-100, 100>;

  public arrayField!: v.float[];
  public optionalArrayField?: v.float[];

  public maxArrayField!: v.float.max<100>[];

}