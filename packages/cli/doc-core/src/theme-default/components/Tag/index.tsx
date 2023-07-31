export const Tag = ({ tag }: { tag?: string }) => {
  if (!tag) {
    return null;
  }
  return (
    <div
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: tag }}
      style={{ width: 20, marginRight: 4 }}
    ></div>
  );
};
