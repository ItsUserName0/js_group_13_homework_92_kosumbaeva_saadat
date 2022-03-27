export interface Message {
  _id: string,
  text: string,
  author: {displayName: string},
  datetime: Date,
}
