import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import ItemList from './components/ItemList';
import { Item } from './types';
import './App.css';

const API_URL = 'http://localhost:3001';

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadItems = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset;
      const res = await axios.get(`${API_URL}/items`, {
        params: {
          offset: currentOffset,
          limit: 20,
          search,
        },
      });

      const newItems: Item[] = res.data.items;

      setItems(prev => (reset ? newItems : [...prev, ...newItems]));
      setSelected(new Set(res.data.selected));
      setOffset(currentOffset + 20);
      setHasMore(currentOffset + 20 < res.data.total);
    },
    [offset, search]
  );

  useEffect(() => {
    const savedSelected = localStorage.getItem('selected');
    const savedSorted = localStorage.getItem('sorted');

    const restoreState = async () => {
      if (savedSorted) {
        const ids: number[] = JSON.parse(savedSorted);
        const selectedIds: number[] = JSON.parse(savedSelected || '[]');
        const res = await axios.get(`${API_URL}/items`, {
          params: {
            ids: ids.join(','),
            offset: 0,
            limit: 20,
          },
        });

        setItems(res.data.items);
        setSelected(new Set(selectedIds));
        setOffset(20);
        setHasMore(res.data.total > 20);
        setIsInitialLoad(false);
      } else {
        await loadItems(true);
        setIsInitialLoad(false);
      }
    };

    restoreState();
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('selected', JSON.stringify(Array.from(selected)));
    }
  }, [selected, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem('sorted', JSON.stringify(items.map(item => item.id)));
    }
  }, [items, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad) {
      setOffset(0);
      loadItems(true);
    }
  }, [search]);

  const handleSelect = async (id: number, isSelected: boolean) => {
    const updated = new Set(selected);
    isSelected ? updated.add(id) : updated.delete(id);
    setSelected(updated);

    await axios.post(`${API_URL}/select`, {
      ids: [id],
      selected: isSelected,
    });
  };

  const handleDragEnd = async (newItems: Item[]) => {
    setItems(newItems);

    await axios.post(`${API_URL}/sort`, {
      newOrder: newItems.map(i => i.id),
    });
  };

  return (
    <div className="app-container">
      <h1>Список элементов</h1>
      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="search-input"
      />
      <div className="list-wrapper">
        <ItemList
          items={items}
          selected={selected}
          onSelect={handleSelect}
          onDragEnd={handleDragEnd}
          loadMore={() => hasMore && loadItems()}
        />
      </div>
    </div>
  );
}

export default App;
