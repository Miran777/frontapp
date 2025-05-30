import React from 'react';
import { FixedSizeList as List, ListOnScrollProps } from 'react-window';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Item } from '../types';

interface Props {
  items: Item[];
  selected: Set<number>;
  onSelect: (id: number, selected: boolean) => void;
  onDragEnd: (newItems: Item[]) => void;
  loadMore: () => void;
}

const ItemList: React.FC<Props> = ({
  items,
  selected,
  onSelect,
  onDragEnd,
  loadMore,
}) => {
  const handleDrag = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onDragEnd(reordered);
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    return (
      <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...style,
              ...provided.draggableProps.style,
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              borderBottom: '1px solid #ddd',
              background: selected.has(item.id) ? '#f0f8ff' : '#fff',
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={(e) => onSelect(item.id, e.target.checked)}
              style={{ marginRight: 10 }}
            />
            {item.value}
          </div>
        )}
      </Draggable>
    );
  };

  const handleScroll = ({ scrollOffset, scrollDirection }: ListOnScrollProps) => {
    if (scrollDirection === 'forward' && scrollOffset > items.length * 30 - 600) {
      loadMore();
    }
  };

  return (
    <DragDropContext onDragEnd={handleDrag}>
        <Droppable
        droppableId="list"
        mode="virtual"
        isDropDisabled={false}
        isCombineEnabled={false}
        renderClone={(provided, snapshot, rubric) => (
            <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
                ...provided.draggableProps.style,
                padding: 8,
                background: '#eee',
            }}
            >
            {items[rubric.source.index].value}
            </div>
        )}
        >
        {(provided) => (
            <List
            height={600}
            itemCount={items.length}
            itemSize={40}
            width="100%"
            outerRef={provided.innerRef}
            onScroll={handleScroll}
            >
            {Row}
            </List>
        )}
        </Droppable>
    </DragDropContext>
  );
};

export default ItemList;
