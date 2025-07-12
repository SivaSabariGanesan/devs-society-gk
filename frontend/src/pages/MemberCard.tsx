import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { ParticlesComponent } from '../components/particles'
import { Code, Building, Calendar as CalendarIcon, Hash, ArrowLeft, User, LogOut, Crown, Download, Share2, Smartphone, Trophy, Sparkles, QrCode, Mail, Phone, Shield, Copy, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import QRCode from 'qrcode'

export function MemberCard() {
  const { user, logout } = useAuth()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [shareSupported, setShareSupported] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Check if Web Share API is supported
    setShareSupported('share' in navigator)
  }, [])

  useEffect(() => {
    if (!user) return

    // Generate QR code with member information
    const memberData = {
      id: user.memberId,
      name: user.fullName,
      email: user.email,
      role: user.role,
      college: user.college,
      batch: user.batchYear,
      portal: 'https://portal.devs-society.com'
    }
    
    QRCode.toDataURL(JSON.stringify(memberData), {
      width: 200,
      margin: 2,
      color: {
        dark: '#0dcaf0',
        light: '#000000'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR Code generation error:', err))
  }, [user])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'core-member':
        return <Crown className="h-6 w-6 text-yellow-400" />
      case 'board-member':
        return <Trophy className="h-6 w-6 text-purple-400" />
      case 'special-member':
        return <Sparkles className="h-6 w-6 text-cyan-400" />
      default:
        return <User className="h-6 w-6 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'core-member':
        return 'from-yellow-500 to-orange-500'
      case 'board-member':
        return 'from-purple-500 to-pink-500'
      case 'special-member':
        return 'from-cyan-500 to-blue-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'core-member':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'
      case 'board-member':
        return 'bg-purple-500/20 text-purple-400 border-purple-400/30'
      case 'special-member':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/30'
    }
  }

  const downloadCard = async () => {
    if (!user) return

    setIsDownloading(true)
    try {
      // Create a canvas to render the card
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) throw new Error('Canvas not supported')

      // Set canvas dimensions (business card size)
      canvas.width = 800
      canvas.height = 500

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#1a1a2e')
      gradient.addColorStop(0.5, '#16213e')
      gradient.addColorStop(1, '#0f172a')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add border
      ctx.strokeStyle = '#00bcd4'
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)

      // Add text content
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px Arial'
      ctx.fillText('DEVS SOCIETY', 50, 80)

      ctx.font = 'bold 28px Arial'
      ctx.fillText(user.fullName, 50, 140)

      ctx.font = '20px Arial'
      ctx.fillStyle = '#a0a0a0'
      ctx.fillText(user.role.replace('-', ' ').toUpperCase(), 50, 170)
      ctx.fillText(`ID: ${user.memberId}`, 50, 200)
      ctx.fillText(user.email, 50, 230)
      ctx.fillText(user.college, 50, 260)

      // Add QR code if available
      if (qrCodeUrl) {
        const qrImg = new Image()
        qrImg.onload = () => {
          ctx.drawImage(qrImg, canvas.width - 180, 50, 120, 120)
          
          // Download the canvas as image
          const link = document.createElement('a')
          link.download = `${user.fullName.replace(/\s+/g, '_')}_DEVS_Card.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
        qrImg.src = qrCodeUrl
      } else {
        // Download without QR code
        const link = document.createElement('a')
        link.download = `${user.fullName.replace(/\s+/g, '_')}_DEVS_Card.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const shareCard = async () => {
    if (!user || !shareSupported) return

    try {
      await navigator.share({
        title: `${user.fullName} - DEVS Society Member`,
        text: `Check out my DEVS Society membership card!`,
        url: window.location.href
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const copyMemberId = async () => {
    if (!user) return

    try {
      await navigator.clipboard.writeText(user.memberId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your card...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <ParticlesComponent className="fixed inset-0" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6 border-b border-gray-800/50 backdrop-blur-md">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <Link to="/portal">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-cyan-400">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse-glow">
              <Code className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold font-techie">DEVS</span>
              <span className="text-lg text-gray-400 ml-2">Card</span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Card Actions */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center gap-4 mb-8"
          >
            <Button 
              variant="gradient" 
              onClick={downloadCard}
              disabled={isDownloading}
              className="group"
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              )}
              {isDownloading ? 'Generating...' : 'Download Card'}
            </Button>
            
            {shareSupported && (
              <Button variant="outline" onClick={shareCard} className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-500/10">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </motion.div>

          {/* Digital Member Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateY: -10 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="perspective-1000"
          >
            <div className={`relative mx-auto max-w-2xl bg-gradient-to-br ${getRoleColor(user.role)} p-1 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300`}>
              {/* Card Inner Content */}
              <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-xl p-8 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-400/10 to-transparent rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
                
                {/* Card Header */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500">
                      <Code className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold font-techie text-white">DEVS SOCIETY</h1>
                      <p className="text-cyan-300 text-sm">Digital Member Card</p>
                    </div>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-full border ${getRoleBadgeColor(user.role)} text-sm font-medium flex items-center gap-2`}>
                    {getRoleIcon(user.role)}
                    {user.role.replace('-', ' ').toUpperCase()}
                  </div>
                </div>

                {/* Member Information */}
                <div className="relative z-10 grid md:grid-cols-2 gap-8">
                  {/* Left Side - Member Details */}
                  <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        {user.photoUrl ? (
                          <img 
                            src={user.photoUrl} 
                            alt={user.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-10 w-10 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{user.fullName}</h2>
                        <p className="text-gray-300">{user.role.replace('-', ' ').toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <Hash className="h-5 w-5 text-cyan-400" />
                        <div className="flex items-center gap-2">
                          <span className="font-medium">ID:</span>
                          <span className="font-mono">{user.memberId}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={copyMemberId}
                            className="p-1 h-auto hover:bg-gray-700/50"
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-gray-300">
                        <Mail className="h-5 w-5 text-cyan-400" />
                        <span>{user.email}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-300">
                        <Phone className="h-5 w-5 text-cyan-400" />
                        <span>{user.phone}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-300">
                        <Building className="h-5 w-5 text-cyan-400" />
                        <span>{user.college}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-300">
                        <CalendarIcon className="h-5 w-5 text-cyan-400" />
                        <span>{user.batchYear}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-300">
                        <Shield className="h-5 w-5 text-cyan-400" />
                        <span>Active Member</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - QR Code */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-white p-4 rounded-xl mb-4">
                      {qrCodeUrl ? (
                        <img 
                          src={qrCodeUrl} 
                          alt="Member QR Code" 
                          className="w-40 h-40"
                        />
                      ) : (
                        <div className="w-40 h-40 bg-gray-200 flex items-center justify-center">
                          <QrCode className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-cyan-300 text-sm font-medium">Scan for verification</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Use this QR code for event check-ins and member verification
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="relative z-10 mt-8 pt-6 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
                  <div>
                    <p>Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p>DEVS Technical Society</p>
                    <p>portal.devs-society.com</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-center mt-12"
          >
            <div className="backdrop-glass rounded-xl p-6 max-w-md mx-auto border border-gray-700">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Smartphone className="h-5 w-5 text-cyan-400" />
                <span className="text-cyan-400 font-medium">Always Available</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Your digital member card is always accessible on your device. 
                Use the QR code for quick verification at events and activities.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 