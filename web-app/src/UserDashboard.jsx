import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

export default function UserDashboard({ session }) {
    const [instruments, setInstruments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [category, setCategory] = useState('Electronic Weighing Balance');
    const [modelNumber, setModelNumber] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [capacity, setCapacity] = useState('');
    const [location, setLocation] = useState('');
    // Add this with your other form states
    const [photoFile, setPhotoFile] = useState(null);

    const fetchMyInstruments = useCallback(async () => {
        setLoading(true);
        // Fetch instruments and their linked verification requests
        const { data, error } = await supabase
            .from('instruments')
            .select(`
        *,
        verification_requests ( status, scheduled_date )
      `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setInstruments(data);
        }
        setLoading(false);
    }, [session.user.id]);

    useEffect(() => {
        let cancelled = false;

        const loadInstruments = async () => {
            if (cancelled) return;
            await fetchMyInstruments();
        };

        loadInstruments();

        return () => {
            cancelled = true;
        };
    }, [fetchMyInstruments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let photoUrl = null;

        // 1. Upload the photograph if one was selected
        if (photoFile) {
            // Create a unique file name to prevent accidental overwrites
            const fileExt = photoFile.name.split('.').pop();
            const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(fileName, photoFile);

            if (uploadError) {
                alert('Error uploading photo: ' + uploadError.message);
                setLoading(false);
                return;
            }

            // Get the public URL for the uploaded photo
            const { data: publicUrlData } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName);

            photoUrl = publicUrlData.publicUrl;
        }

        // 2. Save the instrument details to the database (now including photo_url)
        const { data: instrumentData, error: instError } = await supabase
            .from('instruments')
            .insert([{
                user_id: session.user.id,
                category,
                model_number: modelNumber,
                serial_number: serialNumber,
                capacity,
                location_address: location,
                photo_url: photoUrl // Save the bucket URL here!
            }])
            .select()
            .single();

        if (instError) {
            alert('Error adding instrument: ' + instError.message);
            setLoading(false);
            return;
        }

        // 3. Automatically create a pending verification request for the LMO workflow
        const { error: reqError } = await supabase
            .from('verification_requests')
            .insert([{
                instrument_id: instrumentData.id,
                user_id: session.user.id,
                status: 'pending'
            }]);

        if (reqError) {
            alert('Error submitting application: ' + reqError.message);
        } else {
            alert('Instrument submitted for verification successfully!');
            setShowForm(false);
            // Reset form
            setModelNumber(''); setSerialNumber(''); setCapacity(''); setLocation(''); setPhotoFile(null);
            fetchMyInstruments(); // Refresh the list
        }
        setLoading(false);
    };

    if (loading) return <p>Loading your instruments...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>My Instruments & Applications</h3>
                <button onClick={() => setShowForm(!showForm)} style={{ backgroundColor: '#0056b3', color: 'white' }}>
                    {showForm ? 'Cancel' : '+ Apply for Verification'}
                </button>
            </div>

            {showForm && (
                <div style={{ backgroundColor: '#f9f9f9', padding: '20px', marginTop: '20px', border: '1px solid #ddd' }}>
                    <h4>Submit New Instrument Details</h4>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
                        <label>Instrument Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="Electronic Weighing Balance">Electronic Weighing Balance</option>
                            <option value="Fuel Dispenser">Fuel Dispenser</option>
                            <option value="Storage Tank">Storage Tank</option>
                            <option value="Weighbridge">Weighbridge</option>
                        </select>

                        <input type="text" placeholder="Model Number" value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} required />
                        <input type="text" placeholder="Serial Number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required />
                        <input type="text" placeholder="Capacity (e.g., 50 kg)" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
                        <textarea placeholder="Location Address (Where is the instrument located?)" value={location} onChange={(e) => setLocation(e.target.value)} required />
                        {/* Inside your form block, add this input */}
                        <label style={{ marginTop: '10px' }}>Instrument Photograph (Required):</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotoFile(e.target.files[0])}
                            required
                        />
                        <button type="submit" style={{ backgroundColor: 'green', color: 'white', marginTop: '10px' }}>Submit Application</button>
                    </form>
                </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Instrument</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Serial No.</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Capacity</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Verification Status</th>
                    </tr>
                </thead>
                <tbody>
                    {instruments.length === 0 ? (
                        <tr><td colSpan="4" style={{ padding: '10px', textAlign: 'center' }}>No instruments registered yet.</td></tr>
                    ) : (
                        instruments.map((inst) => {
                            const req = inst.verification_requests[0]; // Get the latest request
                            return (
                                <tr key={inst.id}>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{inst.category} <br /><small>{inst.model_number}</small></td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{inst.serial_number}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{inst.capacity}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        <strong>{req ? req.status.toUpperCase() : 'NO REQUEST'}</strong>
                                        {req && req.scheduled_date && <><br /><small>Date: {req.scheduled_date}</small></>}
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}