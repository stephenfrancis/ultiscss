
export default class RefObject {

  private id: string;
  private referenced_by?: string[];
  private references?: string[];

  constructor(id: string) {
    this.id = id;
  }


  public forEachReference(callback: (ref_to: string) => void, type?: string): void {
    this.iterateCallback(this.references, callback, type);
  }


  public forEachReferencedBy(callback: (ref_to: string) => void, type?: string): void {
    this.iterateCallback(this.referenced_by, callback, type);
  }


  public getId(): string {
    return this.id;
  }


  public getType(): string {
    return this.id.charAt(0);
  }


  private iterateCallback(array: string[], callback: (ref_to: string) => void, type?: string): void {
    if (!array) {
      return;
    }
    array.forEach((object_id: string) => {
      if ((object_id !== this.id) && (!type || object_id.startsWith(type))) {
        callback(object_id);
      }
    });
  }


  public setReferencedBy(ref_from: string): void {
    this.referenced_by = this.referenced_by || [];
    if (this.referenced_by.indexOf(ref_from) === -1) {
      this.referenced_by.push(ref_from);
    }
  }

  public setReference(ref_to: string): void {
    this.references = this.references || [];
    if (this.references.indexOf(ref_to) === -1) {
      this.references.push(ref_to);
    }
  }

}
