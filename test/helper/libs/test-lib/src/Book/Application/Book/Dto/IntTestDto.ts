import { Dto, v } from '@hexancore/common';

export class IntTestDto extends Dto {

  public field!: v.int;
  public optionalField?: v.int;

  public minField!: v.int.min<-100>;
  public maxField!: v.int.max<100>;

  public betweenField!: v.int.between<-100, 100>;

  public gtField!: v.int.gt<-100>;
  public ltField!: v.int.lt<100>;

  public betweenExclusivelyField!: v.int.between_exclusively<-100, 100>;

  public arrayField!: v.int[];
  public optionalArrayField?: v.int[];

  public maxArrayField!: v.int.max<100>[];

}