import { Dto, v, RefId } from '@hexancore/common';

export class TestTransformDto extends Dto {

  public optionalStringField?: string;

  public numberField!: number;
  public stringField!: string;
  public booleanField!: boolean;
  public bigintField!: bigint;

  public primitiveArrayField!: string[];

  public uintField!: v.uint;

  public ruleWithArgsField!: v.int.between<-10, 100>;

  public ruleArrayField!: v.int.between<-10, 100>[];
  public ruleArrayWithItemsField!: v.int.between<-10, 100>[] & v.items.between<2, 5>;

  public hObjField!: RefId;
  public optionalHObjField?: RefId;
  public hObjArrayField!: RefId[];
}
