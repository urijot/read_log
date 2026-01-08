'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Book {
  id: number
  title: string
  author: string
  status?: string
  image_url?: string
}

export default function Home() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [loading, setLoading] = useState(false)
  const [books, setBooks] = useState<Book[]>([])

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('id', { ascending: false })

    if (error) console.error('Error fetching books:', error)
    else setBooks(data || [])
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return

    setLoading(true)

    let authorToSave = author
    let imageUrl = ''

    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}`)
      const data = await res.json()
      if (data.items && data.items.length > 0) {
        const bookInfo = data.items[0].volumeInfo
        if (!authorToSave && bookInfo.authors) {
          authorToSave = bookInfo.authors.join(', ')
        }
        if (bookInfo.imageLinks?.thumbnail) {
          imageUrl = bookInfo.imageLinks.thumbnail
        }
      }
    } catch (err) {
      console.error('API fetch error:', err)
    }

    if (!authorToSave) {
      alert('著者名を入力してください')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('books')
      .insert([{ title, author: authorToSave, image_url: imageUrl }])

    setLoading(false)

    if (error) {
      console.error('Error adding book:', error)
      alert('保存に失敗しました')
    } else {
      alert('保存しました')
      setTitle('')
      setAuthor('')
      fetchBooks()
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('本当に削除しますか？')) return

    const { error } = await supabase.from('books').delete().eq('id', id)

    if (error) {
      console.error('Error deleting book:', error)
      alert('削除に失敗しました')
    } else {
      setBooks(books.filter((book) => book.id !== id))
    }
  }

  const handleUpdateStatus = async (id: number) => {
    const { error } = await supabase
      .from('books')
      .update({ status: '読了' })
      .eq('id', id)

    if (error) {
      console.error('Error updating status:', error)
      alert('更新に失敗しました')
    } else {
      setBooks(books.map((book) => (book.id === id ? { ...book, status: '読了' } : book)))
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center py-10 p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">読書管理</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タイトル
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="本のタイトル"
              required
            />
          </div>
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
              著者
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="著者名"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </form>
      </div>

      <div className="w-full max-w-md space-y-4">
        {books.map((book) => (
          <div key={book.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {book.image_url && (
                <img src={book.image_url} alt={book.title} className="w-12 h-16 object-cover rounded shadow-sm" />
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-800">{book.title}</h3>
                <p className="text-gray-600 text-sm">著者: {book.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {book.status === '読了' ? (
                <span className="text-green-600 font-bold text-sm">読了</span>
              ) : (
                <button
                  onClick={() => handleUpdateStatus(book.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors text-sm"
                >
                  読了
                </button>
              )}
              <button
                onClick={() => handleDelete(book.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}