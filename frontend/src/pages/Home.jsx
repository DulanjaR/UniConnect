import React, { useEffect, useState } from 'react';

async function fetchFeed(year, semester) {
  const params = new URLSearchParams({ year: String(year), semester: String(semester) });
  const res = await fetch(`/api/posts/feed?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load feed');
  return res.json();
}

function PostCard({ item }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #667eea',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: '0', color: '#1f2937', fontSize: '1.1rem' }}>{item.post?.title}</h3>
        <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
          {item.post?.category || 'study'}
        </span>
      </div>

      <p style={{ margin: '0.5rem 0 0 0', color: '#4b5563', lineHeight: '1.6' }}>{item.post?.body}</p>

      {item.post?.tags && item.post.tags.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {item.post.tags.map((tag, idx) => (
            <span key={idx} style={{ backgroundColor: '#f3f4f6', color: '#666', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#999' }}>
        by <strong>{item.post?.author?.name || 'Anonymous'}</strong> • {new Date(item.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

function Home({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchFeed(user.year, user.semester)
      .then((data) => {
        setItems(data || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const yourPosts = items.filter((i) => i.year === user.year && i.semester === user.semester);
  const commonPosts = items.filter((i) => !i.year && !i.semester);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#667eea', fontSize: '1.1rem' }}>Loading posts...</p>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#fee', padding: '1rem', borderRadius: '8px', color: '#c33', marginBottom: '2rem' }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>Your Posts</h2>
              <span style={{ backgroundColor: '#e0e7ff', color: '#667eea', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
                Year {user.year} • Sem {user.semester}
              </span>
            </div>

            {yourPosts.length === 0 ? (
              <div style={{ backgroundColor: '#f0f4ff', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#667eea' }}>
                <p style={{ margin: 0, fontSize: '1.05rem' }}>No posts yet for your batch. Be the first to post!</p>
              </div>
            ) : (
              yourPosts.map((item) => <PostCard key={item._id} item={item} />)
            )}
          </section>

          <section>
            <h2 style={{ color: '#1f2937', marginBottom: '1.5rem' }}>Common Posts</h2>

            {commonPosts.length === 0 ? (
              <div style={{ backgroundColor: '#f0f4ff', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: '#667eea' }}>
                <p style={{ margin: 0, fontSize: '1.05rem' }}>No common posts yet.</p>
              </div>
            ) : (
              commonPosts.map((item) => <PostCard key={item._id} item={item} />)
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Home;
