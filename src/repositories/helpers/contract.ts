import { AvlTree } from "../../interface"

export const convertAvlTree = (avlTrees: AvlTree[]) => {
  const avlTreeMap = new Map<number, [Buffer, Buffer][]>()

  for (const tree of avlTrees) {
    const buffers: [Buffer, Buffer][] = tree.value.avlTree.map((obj: any) => [
      Buffer.from(obj.key.data.data, 'base64'),
      Buffer.from(obj.value.data, 'base64')
    ])
    avlTreeMap.set(tree.key, buffers)
  }

  return avlTreeMap
}
